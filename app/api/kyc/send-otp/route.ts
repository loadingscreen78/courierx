import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { CASHFREE_VERIFICATION_BASE } from '@/lib/wallet/cashfreeConfig';
import crypto from 'crypto';

/**
 * POST /api/kyc/send-otp
 * Step 1: Check if DigiLocker account exists for the given Aadhaar number.
 * Step 2: Create a DigiLocker consent URL and return it to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const appId = process.env.CASHFREE_KYC_CLIENT_ID?.trim();
    const secretKey = process.env.CASHFREE_KYC_CLIENT_SECRET?.trim();

    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'KYC service not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('aadhaar_verified')
      .eq('user_id', user.id)
      .single();

    if (profile?.aadhaar_verified) {
      return NextResponse.json({ error: 'Aadhaar already verified' }, { status: 400 });
    }

    const { aadhaarNumber } = await request.json();

    if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
      return NextResponse.json({ error: 'Invalid Aadhaar number' }, { status: 400 });
    }

    // Check if this Aadhaar is already used by another account
    const aadhaarHash = crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('aadhaar_hash', aadhaarHash)
      .not('user_id', 'eq', user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This Aadhaar number is already verified with another account. Each Aadhaar can only be linked to one account.' },
        { status: 409 }
      );
    }

    const verificationId = `kyc_${user.id.slice(0, 8)}_${Date.now()}`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/kyc/callback`;

    const cfHeaders = {
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
    };

    // Step 1: Check if DigiLocker account exists (best-effort, don't fail on error)
    let userFlow = 'signup';
    try {
      const verifyRes = await fetch(`${CASHFREE_VERIFICATION_BASE}/digilocker/verify-account`, {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
          verification_id: `${verificationId.slice(0, 45)}_v`,
          aadhaar_number: aadhaarNumber,
        }),
      });
      const verifyData = await verifyRes.json();
      console.log('[kyc/send-otp] verify-account response:', verifyData);
      if (verifyData?.status === 'ACCOUNT_EXISTS') userFlow = 'signin';
    } catch (e) {
      console.warn('[kyc/send-otp] verify-account failed, defaulting to signup:', e);
    }

    // Step 2: Create DigiLocker consent URL
    const createBody = {
      verification_id: verificationId,
      document_requested: ['AADHAAR'],
      redirect_url: redirectUrl,
      user_flow: userFlow,
    };
    console.log('[kyc/send-otp] Creating DigiLocker URL:', `${CASHFREE_VERIFICATION_BASE}/digilocker`, createBody);

    const urlRes = await fetch(`${CASHFREE_VERIFICATION_BASE}/digilocker`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify(createBody),
    });

    const urlData = await urlRes.json();
    console.log('[kyc/send-otp] DigiLocker URL response:', urlRes.status, urlData);

    if (!urlRes.ok || !urlData?.url) {
      const msg = urlData?.message || urlData?.error || `Cashfree error ${urlRes.status}`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      digilockerUrl: urlData.url,
      verificationId: urlData.verification_id,
      referenceId: urlData.reference_id,
    });
  } catch (error) {
    console.error('[kyc/send-otp] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
