import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

const NIMBUS_API_BASE = 'https://api.nimbuspost.com/v1';

async function getNimbusToken(): Promise<string> {
  const email = process.env.NIMBUS_EMAIL?.trim();
  const password = process.env.NIMBUS_PASSWORD?.trim();
  if (!email || !password) throw new Error('NIMBUS_EMAIL / NIMBUS_PASSWORD not configured');

  const res = await fetch(`${NIMBUS_API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Nimbus auth failed: ${res.status}`);
  const data = await res.json();
  const token = data?.data;
  if (!token) throw new Error('No token in Nimbus auth response');
  return token;
}

/**
 * GET /api/shipments/awb-label?awb=<awb>
 * Fetches the AWB label PDF from NimbusPost and stores it on the shipment row.
 * Admin-only endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const awb = request.nextUrl.searchParams.get('awb');
    if (!awb) {
      return NextResponse.json({ success: false, error: 'Missing awb parameter' }, { status: 400 });
    }

    // Mock AWBs — no real label available
    if (awb.startsWith('CXD-MOCK-') || awb.startsWith('CX-MOCK-') || awb.startsWith('MOCK-')) {
      return NextResponse.json({
        success: false,
        error: 'This is a mock shipment (NimbusPost credentials were not configured at booking time). Re-book with valid credentials to get a real AWB label.',
      }, { status: 422 });
    }

    // Check if Nimbus creds are configured
    if (!process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'NimbusPost credentials not configured on this server.',
      }, { status: 503 });
    }

    // Fetch label from NimbusPost
    let labelValue: string | null = null;
    try {
      const nimbusToken = await getNimbusToken();

      // Try label endpoint
      const labelRes = await fetch(`${NIMBUS_API_BASE}/label?awb=${encodeURIComponent(awb)}`, {
        headers: { Authorization: `Bearer ${nimbusToken}` },
      });

      if (labelRes.ok) {
        const contentType = labelRes.headers.get('content-type') ?? '';
        if (contentType.includes('application/pdf')) {
          const buffer = await labelRes.arrayBuffer();
          labelValue = `data:application/pdf;base64,${Buffer.from(buffer).toString('base64')}`;
        } else {
          const json = await labelRes.json().catch(() => ({}));
          labelValue = (json as any)?.label_url || (json as any)?.label || null;
        }
      }

      // Fallback: try shipment details endpoint for label URL
      if (!labelValue) {
        const detailRes = await fetch(`${NIMBUS_API_BASE}/shipments?awb=${encodeURIComponent(awb)}`, {
          headers: { Authorization: `Bearer ${nimbusToken}` },
        });
        if (detailRes.ok) {
          const detail = await detailRes.json().catch(() => ({}));
          const shipData = (detail as any)?.data?.[0] || (detail as any)?.data;
          labelValue = shipData?.label_url || shipData?.label || null;
        }
      }
    } catch (nimbusErr) {
      console.error('[awb-label] Nimbus error:', nimbusErr);
      return NextResponse.json({
        success: false,
        error: nimbusErr instanceof Error ? nimbusErr.message : 'Failed to connect to NimbusPost',
      }, { status: 502 });
    }

    if (!labelValue) {
      return NextResponse.json({
        success: false,
        error: 'NimbusPost did not return a label for this AWB. The shipment may still be processing.',
      }, { status: 404 });
    }

    // Persist to shipments row
    await supabase
      .from('shipments')
      .update({ domestic_label_url: labelValue })
      .eq('domestic_awb', awb);

    return NextResponse.json({ success: true, labelUrl: labelValue });
  } catch (error) {
    console.error('[awb-label] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
