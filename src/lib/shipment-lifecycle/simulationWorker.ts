/**
 * International simulation worker.
 *
 * Invoked by cron (POST /api/cron/simulation-worker).
 * Generates mock international tracking events for shipments in the
 * INTERNATIONAL leg, advancing them through the status sequence:
 *   DISPATCHED → IN_INTERNATIONAL_TRANSIT → CUSTOMS_CLEARANCE
 *   → INTL_OUT_FOR_DELIVERY → INTL_DELIVERED
 *
 * - Acquires a per-shipment advisory lock to prevent duplicate/out-of-order events
 * - On error: retries once, then skips the shipment
 *
 * Requirements: 4.2, 4.3, 4.6, 4.7, 11.5
 */

import { getServiceRoleClient } from './supabaseAdmin';
import { updateShipmentStatus } from './stateMachine';
import { ShipmentRow, ShipmentStatus } from './types';

/**
 * Ordered international status sequence. Each shipment advances one step per
 * simulation cycle.
 */
const INTERNATIONAL_SEQUENCE: ShipmentStatus[] = [
  'DISPATCHED',
  'IN_INTERNATIONAL_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'INTL_OUT_FOR_DELIVERY',
  'INTL_DELIVERED',
];

/**
 * Base key for per-shipment advisory locks. The actual lock key is computed as
 * a hash of this base + the shipment ID to avoid collisions with other lock
 * users (e.g., the domestic sync lock at 839271).
 */
const SIM_LOCK_BASE = 920000;

export interface SimulationResult {
  processed: number;
  advanced: number;
  errors: number;
}

/**
 * Runs a single simulation cycle: queries all INTERNATIONAL shipments and
 * advances each one step in the status sequence.
 */
export async function runSimulationWorker(): Promise<SimulationResult> {
  const supabase = getServiceRoleClient();
  const result: SimulationResult = { processed: 0, advanced: 0, errors: 0 };

  // Query all shipments in the INTERNATIONAL leg
  const { data: shipments, error: queryError } = await supabase
    .from('shipments')
    .select('*')
    .eq('current_leg', 'INTERNATIONAL');

  if (queryError) {
    console.error('[simulationWorker] Failed to query shipments:', queryError.message);
    return result;
  }

  if (!shipments || shipments.length === 0) {
    return result;
  }

  for (const raw of shipments) {
    const shipment = raw as unknown as ShipmentRow;
    result.processed++;

    const lockKey = shipmentLockKey(shipment.id);
    const locked = await acquireAdvisoryLock(supabase, lockKey);
    if (!locked) {
      // Another worker is already processing this shipment — skip
      continue;
    }

    try {
      const advanced = await advanceShipment(shipment);
      if (advanced) {
        result.advanced++;
      }
    } catch (err) {
      // Retry once on error
      try {
        const advanced = await advanceShipment(shipment);
        if (advanced) {
          result.advanced++;
        }
      } catch (retryErr) {
        result.errors++;
        console.error(
          `[simulationWorker] Failed after retry for shipment ${shipment.id}:`,
          retryErr instanceof Error ? retryErr.message : retryErr,
        );
      }
    } finally {
      await releaseAdvisoryLock(supabase, lockKey);
    }
  }

  return result;
}

/**
 * Determines the next status for a shipment and applies it via the state machine.
 * Returns true if the shipment was advanced, false if it's already at the end
 * of the sequence (INTL_DELIVERED).
 */
async function advanceShipment(shipment: ShipmentRow): Promise<boolean> {
  const currentIndex = INTERNATIONAL_SEQUENCE.indexOf(shipment.current_status);

  // Not in the international sequence or already at the final status
  if (currentIndex === -1 || currentIndex >= INTERNATIONAL_SEQUENCE.length - 1) {
    return false;
  }

  const nextStatus = INTERNATIONAL_SEQUENCE[currentIndex + 1];

  const updateResult = await updateShipmentStatus({
    shipmentId: shipment.id,
    newStatus: nextStatus,
    source: 'SIMULATION',
    metadata: {
      trigger: 'simulation_worker',
      previousStatus: shipment.current_status,
    },
    expectedVersion: shipment.version,
  });

  if (!updateResult.success) {
    throw new Error(
      `State machine rejected transition ${shipment.current_status} → ${nextStatus}: ${updateResult.error}`,
    );
  }

  return true;
}

// ---------------------------------------------------------------------------
// Per-shipment advisory lock helpers
// ---------------------------------------------------------------------------

/**
 * Derives a deterministic integer lock key from a shipment UUID.
 * Uses a djb2-style hash across all hex characters of the UUID offset by
 * SIM_LOCK_BASE to minimise collisions between distinct shipment IDs.
 */
function shipmentLockKey(shipmentId: string): number {
  const hex = shipmentId.replace(/-/g, '');
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    // Simple djb2-style hash
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) | 0;
  }
  // Ensure positive value within a bounded range and offset by SIM_LOCK_BASE
  return SIM_LOCK_BASE + ((hash >>> 0) % 1_000_000);
}


async function acquireAdvisoryLock(
  supabase: ReturnType<typeof getServiceRoleClient>,
  lockKey: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('pg_try_advisory_lock' as never, {
    lock_key: lockKey,
  } as never);

  if (error) {
    console.error('[simulationWorker] Advisory lock acquisition error:', error.message);
    return false;
  }

  return data === true;
}

async function releaseAdvisoryLock(
  supabase: ReturnType<typeof getServiceRoleClient>,
  lockKey: number,
): Promise<void> {
  const { error } = await supabase.rpc('pg_advisory_unlock' as never, {
    lock_key: lockKey,
  } as never);

  if (error) {
    console.error('[simulationWorker] Advisory lock release error:', error.message);
  }
}
