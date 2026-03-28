import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { CASHFREE_API_BASE, CASHFREE_API_VERSION } from '@/lib/wallet/cashfreeConfig';
import { createDomesticShipment } from '@/lib/domestic/nimbusPostDomestic';

/**
 * Verify a guest booking payment with Cashfree.
 * After payment is confirmed, creates the actual shipment via NimbusPost.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
    const supabase = getServiceRoleClient();

    const devMode = !appId || !secretKey;
    let isPaid = devMode;

    if (!devMode) {
      const cfRes = await fetch(`${CASHFREE_API_BASE}/orders/${orderId}`, {
        headers: {
          'x-api-version': CASHFREE_API_VERSION,
          'x-client-id': appId!,
          'x-client-secret': secretKey!,
        },
      });
      if (!cfRes.ok) {
        return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 });
      }
      const order = await cfRes.json();
      isPaid = order.order_status === 'PAID';
    }

    if (!isPaid) {
      return NextResponse.json({ success: false, error: 'Payment not completed' });
    }

    // Payment confirmed — fetch guest booking data
    const { data: booking, error: bookingErr } = await supabase
      .from('guest_bookings')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (bookingErr || !booking) {
      console.error('[verify-guest-payment] Booking not found:', orderId, bookingErr);
      return NextResponse.json({ success: true, awbUrl: '', error: 'Booking record not found' });
    }

    // Already processed — return existing AWB
    if (booking.status === 'shipped' && booking.awb_number) {
      return NextResponse.json({
        success: true,
        awbUrl: booking.label_url || '',
        awb: booking.awb_number,
        trackingNumber: booking.tracking_number,
      });
    }

    // Mark as paid
    await supabase
      .from('guest_bookings')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('order_id', orderId);

    // Parse the stored booking payload for NimbusPost
    let bookingPayload: any = null;
    try {
      bookingPayload = typeof booking.booking_payload === 'string'
        ? JSON.parse(booking.booking_payload)
        : booking.booking_payload;
    } catch {
      console.error('[verify-guest-payment] Failed to parse booking_payload');
    }

    if (!bookingPayload) {
      return NextResponse.json({
        success: true,
        awbUrl: '',
        error: 'Booking payload missing — cannot create shipment',
      });
    }

    const { senderReceiver, rateFormData, selectedCourier } = bookingPayload;

    // Create shipment via NimbusPost
    const skipNimbus = !process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD;

    let awb = '';
    let labelUrl = '';

    if (skipNimbus) {
      awb = `CXD-MOCK-${Date.now()}`;
      console.warn('[verify-guest-payment] NimbusPost credentials missing — using mock AWB');
    } else {
      try {
        const courierId = selectedCourier?.courier_company_id
          || selectedCourier?.courier_id
          || selectedCourier?.id;

        const weightKg = rateFormData?.weightKg
          || rateFormData?.weightGrams ? (rateFormData.weightGrams / 1000) : 0.5;

        const nimbusResult = await createDomesticShipment({
          courier_id: Number(courierId),
          pickup: {
            name: senderReceiver.senderName,
            phone: senderReceiver.senderPhone,
            address: senderReceiver.senderAddress,
            city: senderReceiver.senderCity,
            state: rateFormData?.senderState || senderReceiver.senderCity,
            pincode: senderReceiver.senderPincode,
          },
          delivery: {
            name: senderReceiver.receiverName,
            phone: senderReceiver.receiverPhone,
            address: senderReceiver.receiverAddress,
            city: senderReceiver.receiverCity,
            state: rateFormData?.receiverState || senderReceiver.receiverCity,
            pincode: senderReceiver.receiverZipcode || senderReceiver.receiverPincode,
          },
          order_amount: booking.amount,
          weight: weightKg,
          length: rateFormData?.lengthCm || 20,
          breadth: rateFormData?.widthCm || 15,
          height: rateFormData?.heightCm || 10,
          payment_type: 'prepaid',
          content_description: senderReceiver.contentDescription
            || rateFormData?.shipmentType
            || 'Guest Shipment',
        });

        if (nimbusResult.success && nimbusResult.awb) {
          awb = nimbusResult.awb;
          labelUrl = nimbusResult.label_url || '';
          console.log('[verify-guest-payment] NimbusPost shipment created:', awb);
        } else {
          console.error('[verify-guest-payment] NimbusPost failed:', nimbusResult.error);
          // Still return success for payment — shipment can be retried
          await supabase
            .from('guest_bookings')
            .update({ status: 'paid_nimbus_failed', nimbus_error: nimbusResult.error || 'Unknown error' })
            .eq('order_id', orderId);

          return NextResponse.json({
            success: true,
            awbUrl: '',
            error: nimbusResult.error || 'Shipment creation failed — our team will process it manually',
          });
        }
      } catch (err: any) {
        console.error('[verify-guest-payment] NimbusPost exception:', err);
        await supabase
          .from('guest_bookings')
          .update({ status: 'paid_nimbus_failed', nimbus_error: err?.message || 'Exception' })
          .eq('order_id', orderId);

        return NextResponse.json({
          success: true,
          awbUrl: '',
          error: 'Shipment creation failed — our team will process it manually',
        });
      }
    }

    // Update guest booking with AWB
    await supabase
      .from('guest_bookings')
      .update({
        status: 'shipped',
        awb_number: awb,
        label_url: labelUrl,
      })
      .eq('order_id', orderId);

    return NextResponse.json({
      success: true,
      awbUrl: labelUrl,
      awb,
      trackingNumber: booking.tracking_number,
    });
  } catch (error) {
    console.error('[verify-guest-payment] Error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
