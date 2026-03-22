import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { trackDomesticShipment } from '@/lib/domestic/nimbusPostDomestic';
import { mapNimbusStatus } from '@/lib/shipment-lifecycle/statusMapping';
import { updateShipmentStatus } from '@/lib/shipment-lifecycle/stateMachine';

/**
 * GET /api/shipments/track?id=<shipmentId>
 *
 * On-demand tracking refresh for a single shipment.
 * - Authenticated users can track their own shipments
 * - Admins can track any shipment
 * - Fetches live data from NimbusPost for domestic AWB
 * - Writes new status to shipment_timeline via state machine
 * - Returns the full timeline from DB
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const shipmentId = request.nextUrl.searchParams.get('id');

    if (!shipmentId) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }

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

    // Fetch shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    // Auth check: must be owner or admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin');

    if (shipment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Fetch timeline from DB
    const { data: timelineRows } = await supabase
      .from('shipment_timeline')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true });

    const timeline = timelineRows ?? [];

    // If no domestic AWB or shipment is past domestic leg, return DB timeline only
    if (!shipment.domestic_awb || shipment.current_leg !== 'DOMESTIC') {
      return NextResponse.json({
        success: true,
        shipment,
        timeline,
        nimbusRefreshed: false,
      });
    }

    // Skip mock AWBs
    const isMock = shipment.domestic_awb.startsWith('CXD-MOCK-') ||
      shipment.domestic_awb.startsWith('CX-MOCK-') ||
      shipment.domestic_awb.startsWith('MOCK-');

    if (isMock) {
      return NextResponse.json({
        success: true,
        shipment,
        timeline,
        nimbusRefreshed: false,
        note: 'Mock AWB — no live tracking available',
      });
    }

    // Fetch live tracking from NimbusPost
    let nimbusRefreshed = false;
    let nimbusError: string | undefined;

    try {
      const trackResult = await trackDomesticShipment(shipment.domestic_awb);

      if (trackResult.success && trackResult.currentStatus) {
        const mappedStatus = mapNimbusStatus(trackResult.currentStatus);

        if (mappedStatus && mappedStatus !== shipment.current_status) {
          // Push new status through state machine
          const updateResult = await updateShipmentStatus({
            shipmentId,
            newStatus: mappedStatus,
            source: 'NIMBUS',
            metadata: {
              trigger: 'on_demand_track',
              rawNimbusStatus: trackResult.currentStatus,
              location: trackResult.currentLocation,
            },
            expectedVersion: shipment.version,
          });

          if (updateResult.success) {
            nimbusRefreshed = true;
          }
        } else {
          nimbusRefreshed = true; // fetched OK, just no new status
        }
      } else {
        nimbusError = trackResult.error;
      }
    } catch (err) {
      nimbusError = err instanceof Error ? err.message : 'Nimbus fetch failed';
      console.error('[track] Nimbus error:', nimbusError);
    }

    // Re-fetch timeline after potential update
    const { data: freshTimeline } = await supabase
      .from('shipment_timeline')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true });

    // Re-fetch shipment for latest status
    const { data: freshShipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    return NextResponse.json({
      success: true,
      shipment: freshShipment ?? shipment,
      timeline: freshTimeline ?? timeline,
      nimbusRefreshed,
      nimbusError,
    });
  } catch (error) {
    console.error('[track] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
