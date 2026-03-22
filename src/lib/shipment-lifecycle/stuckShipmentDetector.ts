import { getServiceRoleClient } from './supabaseAdmin';

export interface StuckShipment {
  id: string;
  tracking_number: string | null;
  domestic_awb: string | null;
  current_status: string;
  created_at: string;
  hoursStuck: number;
}

export interface StuckDetectionResult {
  count: number;
  shipments: StuckShipment[];
}

/**
 * Detects DOMESTIC leg shipments that have been stuck at BOOKING_CONFIRMED
 * for more than 48 hours — meaning Nimbus never picked them up.
 *
 * Returns the list so the cron handler can log/alert as needed.
 */
export async function detectStuckShipments(): Promise<StuckDetectionResult> {
  const supabase = getServiceRoleClient();

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('shipments')
    .select('id, tracking_number, domestic_awb, current_status, created_at')
    .eq('current_leg', 'DOMESTIC')
    .eq('current_status', 'BOOKING_CONFIRMED')
    .lt('created_at', cutoff);

  if (error) {
    console.error('[stuckShipmentDetector] Query failed:', error);
    return { count: 0, shipments: [] };
  }

  const shipments: StuckShipment[] = (data ?? []).map((s: any) => ({
    id: s.id,
    tracking_number: s.tracking_number,
    domestic_awb: s.domestic_awb,
    current_status: s.current_status,
    created_at: s.created_at,
    hoursStuck: Math.floor((Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60)),
  }));

  if (shipments.length > 0) {
    console.warn(`[stuckShipmentDetector] ${shipments.length} stuck shipment(s) detected:`,
      shipments.map(s => `${s.tracking_number ?? s.id} (${s.hoursStuck}h)`).join(', ')
    );
  }

  return { count: shipments.length, shipments };
}
