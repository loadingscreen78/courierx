/**
 * Stuck shipment detection utility.
 *
 * Detects shipments that have been in the DOMESTIC leg for more than 48 hours
 * and flags them for operator review by logging a warning and adding metadata
 * to the shipment_timeline table.
 *
 * Requirements: 12.3
 */

import { getServiceRoleClient } from './supabaseAdmin';
import { ShipmentRow } from './types';

const STUCK_THRESHOLD_HOURS = 48;

export interface StuckShipmentResult {
  detected: number;
  flagged: number;
  errors: number;
}

/**
 * Queries shipments stuck in the DOMESTIC leg for over 48 hours and
 * inserts a SYSTEM timeline entry flagging them for operator review.
 */
export async function detectStuckShipments(): Promise<StuckShipmentResult> {
  const supabase = getServiceRoleClient();
  const result: StuckShipmentResult = { detected: 0, flagged: 0, errors: 0 };

  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();

  const { data: shipments, error: queryError } = await supabase
    .from('shipments')
    .select('*')
    .eq('current_leg', 'DOMESTIC')
    .lt('created_at', cutoff);

  if (queryError) {
    console.error('[stuckShipmentDetector] Failed to query stuck shipments:', queryError.message);
    return result;
  }

  if (!shipments || shipments.length === 0) {
    return result;
  }

  result.detected = shipments.length;

  for (const raw of shipments) {
    const shipment = raw as unknown as ShipmentRow;
    const ageHours = Math.round((Date.now() - new Date(shipment.created_at).getTime()) / (1000 * 60 * 60));

    console.warn(
      `[stuckShipmentDetector] Shipment ${shipment.id} stuck in DOMESTIC leg for ${ageHours}h ` +
      `(status: ${shipment.current_status}, AWB: ${shipment.domestic_awb ?? 'none'})`,
    );

    // Insert a SYSTEM timeline entry to flag the shipment for operator review
    const { error: insertError } = await supabase
      .from('shipment_timeline')
      .insert({
        shipment_id: shipment.id,
        status: shipment.current_status,
        leg: shipment.current_leg,
        source: 'SYSTEM',
        metadata: {
          alert_type: 'stuck_shipment',
          stuck_hours: ageHours,
          threshold_hours: STUCK_THRESHOLD_HOURS,
          detected_at: new Date().toISOString(),
        },
      });

    if (insertError) {
      result.errors++;
      console.error(
        `[stuckShipmentDetector] Failed to flag shipment ${shipment.id}:`,
        insertError.message,
      );
    } else {
      result.flagged++;
    }
  }

  return result;
}
