import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

/**
 * GET /api/track?awb=<tracking_number_or_awb_or_phone>
 *
 * Public endpoint — no auth required.
 * Looks up by tracking_number, domestic_awb, or recipient_phone.
 * Returns shipment + full timeline for the customer tracking page.
 */
export async function GET(request: NextRequest) {
  const awb = request.nextUrl.searchParams.get('awb')?.trim();

  if (!awb) {
    return NextResponse.json({ success: false, error: 'Missing awb parameter' }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  // Try tracking_number first, then domestic_awb, then recipient_phone
  let shipment: any = null;

  const { data: byTracking } = await supabase
    .from('shipments')
    .select('id, tracking_number, current_status, current_leg, domestic_awb, international_awb, recipient_name, destination_country, destination_address, origin_address, weight_kg, shipment_type, created_at')
    .eq('tracking_number', awb)
    .maybeSingle();

  if (byTracking) {
    shipment = byTracking;
  } else {
    const { data: byAwb } = await supabase
      .from('shipments')
      .select('id, tracking_number, current_status, current_leg, domestic_awb, international_awb, recipient_name, destination_country, destination_address, origin_address, weight_kg, shipment_type, created_at')
      .eq('domestic_awb', awb)
      .maybeSingle();

    if (byAwb) {
      shipment = byAwb;
    } else {
      // Phone lookup (used after OTP verification)
      const { data: byPhone } = await supabase
        .from('shipments')
        .select('id, tracking_number, current_status, current_leg, domestic_awb, international_awb, recipient_name, destination_country, destination_address, origin_address, weight_kg, shipment_type, created_at')
        .eq('recipient_phone', awb)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (byPhone) shipment = byPhone;
    }
  }

  if (!shipment) {
    return NextResponse.json({ success: false, error: 'No shipment found with this tracking number.' }, { status: 404 });
  }

  // Fetch full timeline
  const { data: timeline } = await supabase
    .from('shipment_timeline')
    .select('id, status, leg, source, metadata, created_at')
    .eq('shipment_id', shipment.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    success: true,
    shipment,
    timeline: timeline ?? [],
  });
}
