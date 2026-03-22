import { getServiceRoleClient } from './supabaseAdmin';
import { updateShipmentStatus } from './stateMachine';
import type { ShipmentRow, ShipmentStatus } from './types';

export interface SimulationResult {
  processed: number;
  advanced: number;
  errors: number;
  details: Array<{ shipmentId: string; from: string; to?: string; error?: string }>;
}

// How many hours must pass at each status before advancing to the next
const ADVANCE_AFTER_HOURS: Partial<Record<ShipmentStatus, number>> = {
  DISPATCHED: 12,
  IN_INTERNATIONAL_TRANSIT: 48,
  CUSTOMS_CLEARANCE: 24,
  INTL_OUT_FOR_DELIVERY: 6,
};

const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  DISPATCHED: 'IN_INTERNATIONAL_TRANSIT',
  IN_INTERNATIONAL_TRANSIT: 'CUSTOMS_CLEARANCE',
  CUSTOMS_CLEARANCE: 'INTL_OUT_FOR_DELIVERY',
  INTL_OUT_FOR_DELIVERY: 'INTL_DELIVERED',
};

/**
 * Advances INTERNATIONAL leg shipments through simulated stages based on
 * time elapsed since the last status update.
 *
 * Called by /api/cron/simulation-worker (secured by CRON_SECRET).
 */
export async function runSimulationWorker(): Promise<SimulationResult> {
  const supabase = getServiceRoleClient();
  const result: SimulationResult = { processed: 0, advanced: 0, errors: 0, details: [] };

  const { data: shipments, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('current_leg', 'INTERNATIONAL')
    .not('current_status', 'in', '("INTL_DELIVERED","FAILED")');

  if (error) {
    console.error('[simulationWorker] Failed to fetch shipments:', error);
    return result;
  }

  const rows = (shipments ?? []) as unknown as ShipmentRow[];
  result.processed = rows.length;

  for (const shipment of rows) {
    const nextStatus = NEXT_STATUS[shipment.current_status];
    if (!nextStatus) {
      result.details.push({ shipmentId: shipment.id, from: shipment.current_status, error: 'No next status defined' });
      continue;
    }

    const hoursRequired = ADVANCE_AFTER_HOURS[shipment.current_status] ?? 24;

    // Get the timestamp of the last timeline entry for this shipment
    const { data: lastEntry } = await supabase
      .from('shipment_timeline')
      .select('created_at')
      .eq('shipment_id', shipment.id)
      .eq('status', shipment.current_status)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastUpdated = lastEntry?.created_at ?? shipment.updated_at ?? shipment.created_at;
    const hoursElapsed = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);

    if (hoursElapsed < hoursRequired) {
      result.details.push({ shipmentId: shipment.id, from: shipment.current_status });
      continue;
    }

    const updateResult = await updateShipmentStatus({
      shipmentId: shipment.id,
      newStatus: nextStatus,
      source: 'SIMULATION',
      metadata: { hoursElapsed: Math.floor(hoursElapsed), simulatedAt: new Date().toISOString() },
      expectedVersion: shipment.version,
    });

    if (updateResult.success) {
      result.advanced++;
      result.details.push({ shipmentId: shipment.id, from: shipment.current_status, to: nextStatus });
    } else if (updateResult.errorCode === 'VERSION_CONFLICT') {
      result.details.push({ shipmentId: shipment.id, from: shipment.current_status, error: 'VERSION_CONFLICT (skipped)' });
    } else {
      result.errors++;
      result.details.push({ shipmentId: shipment.id, from: shipment.current_status, error: updateResult.error });
    }
  }

  console.log(`[simulationWorker] Done — processed: ${result.processed}, advanced: ${result.advanced}, errors: ${result.errors}`);
  return result;
}
