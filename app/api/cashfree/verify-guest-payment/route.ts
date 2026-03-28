import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { CASHFREE_API_BASE, CASHFREE_API_VERSION } from '@/lib/wallet/cashfreeConfig';
import { createDomesticShipment } from '@/lib/domestic/nimbusPostDomestic';
import { lookupPincode } from '@/lib/pincode-lookup';

/**
 * Verify a guest booking payment with Cashfree.
 * After payment is confirmed, creates the actual shipment via NimbusPost
 * and returns the AWB + label URL.
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

    // Fetch guest booking data
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

    // Parse stored booking payload
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

    // ── Create NimbusPost shipment ──
    const skipNimbus = !process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD;

    let awb = '';
    let labelUrl = '';

    if (skipNimbus) {
      awb = `CXD-MOCK-${Date.now()}`;
      console.warn('[verify-guest-payment] NimbusPost credentials missing — mock AWB');
    } else {
      try {
        // Resolve courier_id — NimbusPost returns this in rate check
        const courierId = Number(
          selectedCourier?.courier_company_id
          || selectedCourier?.courier_id
          || selectedCourier?.id
          || 0
        );

        if (!courierId) {
          throw new Error('No courier_company_id in selectedCourier');
        }

        // Get weight — domestic form uses weightKg
        const weightKg = Number(rateFormData?.weightKg) || 0.5;

        // Clean phone numbers — NimbusPost expects 10-digit Indian numbers
        const cleanPhone = (phone: string) => {
          const digits = (phone || '').replace(/\D/g, '');
          // Remove leading 91 country code if present
          return digits.length > 10 ? digits.slice(-10) : digits || '9999999999';
        };

        // Get sender/receiver pincodes
        const senderPincode = senderReceiver.senderPincode
          || rateFormData?.pickupPincode || '';
        const receiverPincode = senderReceiver.receiverZipcode
          || senderReceiver.receiverPincode
          || rateFormData?.deliveryPincode || '';

        // Lookup states from pincodes (NimbusPost requires state)
        const [senderLookup, receiverLookup] = await Promise.all([
          lookupPincode(senderPincode),
          lookupPincode(receiverPincode),
        ]);

        const senderState = senderLookup?.state || 'Unknown';
        const receiverState = receiverLookup?.state || 'Unknown';
        const senderCity = senderReceiver.senderCity || senderLookup?.city || 'Unknown';
        const receiverCity = senderReceiver.receiverCity || receiverLookup?.city || 'Unknown';

        console.log('[verify-guest-payment] NimbusPost payload:', JSON.stringify({
          courier_id: courierId,
          tracking: booking.tracking_number,
          weight: weightKg,
          senderPincode,
          receiverPincode,
          senderState,
          receiverState,
        }));

        const nimbusResult = await createDomesticShipment({
          courier_id: courierId,
          order_number: booking.tracking_number || `CXG-${Date.now()}`,
          pickup: {
            name: senderReceiver.senderName || 'Sender',
            phone: cleanPhone(senderReceiver.senderPhone),
            address: senderReceiver.senderAddress || 'Address',
            city: senderCity,
            state: senderState,
            pincode: senderPincode,
          },
          delivery: {
            name: senderReceiver.receiverName || 'Receiver',
            phone: cleanPhone(senderReceiver.receiverPhone),
            address: senderReceiver.receiverAddress || 'Address',
            city: receiverCity,
            state: receiverState,
            pincode: receiverPincode,
          },
          order_amount: Number(rateFormData?.declaredValue) || Number(booking.amount) || 100,
          weight: weightKg,
          length: Number(rateFormData?.lengthCm) || 20,
          breadth: Number(rateFormData?.widthCm) || 15,
          height: Number(rateFormData?.heightCm) || 10,
          payment_type: 'prepaid',
          content_description: senderReceiver.contentDescription
            || rateFormData?.shipmentType
            || 'Guest Shipment',
        });

        if (nimbusResult.success && nimbusResult.awb) {
          awb = nimbusResult.awb;
          labelUrl = nimbusResult.label_url || '';
          console.log('[verify-guest-payment] NimbusPost shipment created. AWB:', awb);
        } else {
          console.error('[verify-guest-payment] NimbusPost failed:', nimbusResult.error);
          await supabase
            .from('guest_bookings')
            .update({ status: 'paid_nimbus_failed', nimbus_error: nimbusResult.error || 'Unknown' })
            .eq('order_id', orderId);

          return NextResponse.json({
            success: true,
            awbUrl: '',
            trackingNumber: booking.tracking_number,
            error: nimbusResult.error || 'Shipment creation failed — our team will process manually',
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
          trackingNumber: booking.tracking_number,
          error: 'Shipment creation failed — our team will process manually',
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
