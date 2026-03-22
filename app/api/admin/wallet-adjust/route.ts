import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { getOtpStore } from '@/lib/admin/walletOtpStore';

const MAX_OTP_ATTEMPTS = 3;

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((r: any) => r.role === 'admin')) return null;
  return user;
}

/**
 * POST /api/admin/wallet-adjust
 * Body: { userId, amount, description, otp }
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, amount, description, otp } = await request.json();

    // Step 1: Validate OTP
    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit OTP' }, { status: 400 });
    }

    const otpStore = getOtpStore();
    const stored = otpStore.get(admin.id);

    if (!stored) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(admin.id);
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
    }

    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(admin.id);
      return NextResponse.json(
        { error: 'Too many wrong attempts. Please request a new OTP.', otpExpired: true },
        { status: 429 }
      );
    }

    if (stored.code !== otp) {
      stored.attempts += 1;
      const remaining = MAX_OTP_ATTEMPTS - stored.attempts;
      if (remaining <= 0) {
        otpStore.delete(admin.id);
        return NextResponse.json(
          { error: 'Incorrect OTP. No attempts remaining. Please request a new OTP.', otpExpired: true },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Incorrect OTP. ${remaining} attempt(s) remaining.`, attemptsRemaining: remaining },
        { status: 400 }
      );
    }

    // OTP is valid — clear it so it can't be reused
    otpStore.delete(admin.id);

    // Step 2: Validate inputs
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Amount must be between ₹1 and ₹10,00,000' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a reason (min 3 characters)' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Step 3: Verify user exists
    const { data: { user: targetUser }, error: userErr } = await supabase.auth.admin.getUserById(userId);
    if (userErr || !targetUser) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Step 4: Insert wallet ledger entry
    const idempotencyKey = `admin_adjust_${admin.id}_${userId}_${Date.now()}`;
    const { error: ledgerErr } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: userId,
        transaction_type: 'credit',
        amount: numAmount,
        description: `[Admin Adjustment] ${description.trim()}`,
        reference_id: `ADMIN-${admin.id.slice(0, 8)}`,
        reference_type: 'payment',
        idempotency_key: idempotencyKey,
        metadata: {
          adjusted_by: admin.id,
          adjusted_by_email: admin.email,
          reason: description.trim(),
          type: 'admin_wallet_adjustment',
        },
      });

    if (ledgerErr) {
      console.error('[admin/wallet-adjust] ledger insert error:', ledgerErr);
      return NextResponse.json({ error: 'Failed to adjust wallet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `₹${numAmount.toLocaleString('en-IN')} added to wallet`,
    });
  } catch (err) {
    console.error('[admin/wallet-adjust] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
