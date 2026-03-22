import { getServiceRoleClient } from './supabaseAdmin';
import { updateShipmentStatus } from './stateMachine';
import { trackDomesticShipment } from '@/lib/domestic/nimbusPostDomestic';
import { mapNimbusStatus } from './statusMapping';
import type { ShipmentRow } from './types';

export interface SyncResult {
  processed: number;
  updated: number;
  errors: number;
  details: Array<{ shipmentId: string; awb: string; status?: string; error?: string }>;
}

/**
 * Polls NimbusPost for all active DOMESTIC leg shipments and updates
 * their status via the state machine when Nimbus reports a change.
 *
 * Called by the /api/cron/domestic-sync endpoint (secured by CRON_SECRET).
 */
export async function runDomesticSync(): Promise<SyncResult> {
  const supabase = getServiceRoleClient();
  const result: SyncResult = { processed: 0, updated: 0, errors: 0, details: [] };

  // Fetch all DOMESTIC leg shipments that are not yet delivered or failed
  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('current_leg', 'DOMESTIC')
    .not('current_status', 'in', '("DELIVERED","FAILED")')
    .not('domestic_awb', 'is', null);

  if (error) {
    console.error('[backgroundSync] Failed to fetch shipments:', error);
    return result;
  }

  const rows = (shipments ?? []) as unknown as ShipmentRow[];
  result.processed = rows.length;

  for (const shipment of rows) {
    const awb = shipment.domestic_awb!;
    try {
      const trackResult = await trackDomesticShipment(awb);

      if (!trackResult.success || !trackResult.currentStatus) {
        result.details.push({ shipmentId: shipment.id, awb, error: trackResult.error ?? 'No status' });
        continue;
      }

      const mappedStatus = mapNimbusStatus(trackResult.currentStatus);

      if (!mappedStatus) {
        // Unknown status string — skip, don't fail
        result.details.push({ shipmentId: shipment.id, awb, status: trackResult.currentStatus, error: 'Unmapped status' });
        continue;
      }

      // Skip if already at this status
      if (mappedStatus === shipment.current_status) {
        result.details.push({ shipmentId: shipment.id, awb, status: mappedStatus });
        continue;
      }

      const updateResult = await updateShipmentStatus({
        shipmentId: shipment.id,
        newStatus: mappedStatus,
        source: 'NIMBUS',
        metadata: {
          awb,
          nimbusRawStatus: trackResult.currentStatus,
          location: trackResult.currentLocation ?? '',
        },
        expectedVersion: shipment.version,
      });

      if (updateResult.success) {
        result.updated++;
        result.details.push({ shipmentId: shipment.id, awb, status: mappedStatus });
      } else if (updateResult.errorCode === 'VERSION_CONFLICT') {
        // Another process updated it — not an error, just skip
        result.details.push({ shipmentId: shipment.id, awb, error: 'VERSION_CONFLICT (skipped)' });
      } else if (updateResult.errorCode === 'INVALID_TRANSITION') {
        // Nimbus may report a status we can't transition to from current state — log and skip
        result.details.push({ shipmentId: shipment.id, awb, status: mappedStatus, error: `INVALID_TRANSITION from ${shipment.current_status}` });
      } else {
        result.errors++;
        result.details.push({ shipmentId: shipment.id, awb, error: updateResult.error });
      }
    } catch (err) {
      result.errors++;
      result.details.push({ shipmentId: shipment.id, awb, error: String(err) });
    }
  }

  console.log(`[backgroundSync] Done — processed: ${result.processed}, updated: ${result.updated}, errors: ${result.errors}`);
  return result;
}
