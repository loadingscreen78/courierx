import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { trackDomesticShipment } from '@/lib/domestic/nimbusPostDomestic';
import { mapNimbusStatus } from '@/lib/shipment-lifecycle/statusMapping';
import { updateShipmentStatus } from '@/lib/shipment-lifecycle/stateMachine';

/**
 * GET /api/track?awb=<tracking_number>
 *
 * Public (unauthenticated) tracking endpoint.
 * Returns shipment status + full timeline by tracking number.
 * Triggers a live Nimbus refresh for domestic shipments.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const awb = request.nextUrl.searchParams.get('awb')?.trim();

    if (!awb) {
      return NextResponse.json({ success: false, error: 'Missing awb parameter' }, { status: 400 });
    }

    // Look up shipment by tracking_number or domestic_awb
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('id, tracking_number, current_status, current_leg, domestic_awb, international_awb, recipient_name, destination_country, destination_address, origin_address, weight_kg, shipment_type, created_at, updated_at, version')
      .or(`tracking_number.eq.${awb},domestic_awb.eq.${awb}`)
      .maybeSingle();

    if (error || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    // Fetch timeline
    const { data: timelineRows } = await supabase
      .from('shipment_timeline')
      .select('id, status, leg, source, metadata, created_at')
      .eq('shipment_id', shipment.id)
      .order('created_at', { ascending: true });

    let timeline = timelineRows ?? [];
    let nimbusRefreshed = false;

    // Live Nimbus refresh for active domestic shipments
    const isMock = (shipment.domestic_awb ?? '').startsWith('CXD-MOCK-') ||
      (shipment.domestic_awb ?? '').startsWith('CX-MOCK-') ||
      (shipment.domestic_awb ?? '').startsWith('MOCK-');

    if (shipment.domestic_awb && shipment.current_leg === 'DOMESTIC' && !isMock) {
      try {
        const trackResult = await trackDomesticShipment(shipment.domestic_awb);

        if (trackResult.success && trackResult.currentStatus) {
          const mappedStatus = mapNimbusStatus(trackResult.currentStatus);

          if (mappedStatus && mappedStatus !== shipment.current_status) {
            await updateShipmentStatus({
              shipmentId: shipment.id,
              newStatus: mappedStatus,
              source: 'NIMBUS',
              metadata: {
                trigger: 'public_track',
                rawNimbusStatus: trackResult.currentStatus,
                location: trackResult.currentLocation,
              },
              expectedVersion: shipment.version,
            });
            nimbusRefreshed = true;
          }

          // Re-fetch timeline after update
          const { data: fresh } = await supabase
            .from('shipment_timeline')
            .select('id, status, leg, source, metadata, created_at')
            .eq('shipment_id', shipment.id)
            .order('created_at', { ascending: true });
          timeline = fresh ?? timeline;
        }
      } catch (err) {
        console.error('[public-track] Nimbus error:', err);
      }
    }

    // Re-fetch shipment for latest status
    const { data: freshShipment } = await supabase
      .from('shipments')
      .select('id, tracking_number, current_status, current_leg, domestic_awb, international_awb, recipient_name, destination_country, destination_address, origin_address, weight_kg, shipment_type, created_at, updated_at')
      .eq('id', shipment.id)
      .single();

    return NextResponse.json({
      success: true,
      shipment: freshShipment ?? shipment,
      timeline,
      nimbusRefreshed,
    });
  } catch (error) {
    console.error('[public-track] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
