import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { CASHFREE_API_BASE, CASHFREE_API_VERSION } from '@/lib/wallet/cashfreeConfig';

/**
 * Verify a guest booking payment with Cashfree.
 * No auth required — uses orderId to look up the payment.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

    if (!appId || !secretKey) {
      // Dev mode — assume success
      return NextResponse.json({ success: true, awbUrl: '' });
    }

    // Verify with Cashfree
    const cfRes = await fetch(`${CASHFREE_API_BASE}/orders/${orderId}`, {
      headers: {
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
    });

    if (!cfRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
    }

    const order = await cfRes.json();
    const isPaid = order.order_status === 'PAID';

    if (isPaid) {
      // Update guest booking status
      const supabase = getServiceRoleClient();
      try {
        await supabase
          .from('guest_bookings')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('order_id', orderId);
      } catch {
        // Table may not exist — continue
      }
    }

    return NextResponse.json({
      success: isPaid,
      orderStatus: order.order_status,
      awbUrl: '',
    });
  } catch (error) {
    console.error('[verify-guest-payment] Error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
