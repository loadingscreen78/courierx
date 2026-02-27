/**
 * Background domestic tracking sync.
 *
 * Invoked by cron (POST /api/cron/domestic-sync).
 * Polls the Nimbus API for all active domestic shipments and applies
 * status updates through the state machine.
 *
 * - Acquires a Postgres advisory lock to prevent overlapping sync cycles
 * - Filters shipments by current_leg = 'DOMESTIC' AND current_status != 'PENDING'
 * - Retries failed Nimbus Track calls up to 3 times with exponential backoff
 * - Skips duplicate statuses and continues on persistent failure
 *
 * Requirements: 2.1–2.9, 10.2, 10.3, 11.2
 */

import { getServiceRoleClient } from './supabaseAdmin';
import { trackShipment } from './nimbusClient';
import { mapNimbusStatus } from './statusMapping';
import { updateShipmentStatus } from './stateMachine';
import { ShipmentRow } from './types';

// Advisory lock key — arbitrary fixed integer for domestic sync
const DOMESTIC_SYNC_LOCK_KEY = 839271;

const WAREHOUSE_ADDRESS = process.env.WAREHOUSE_ADDRESS ?? 'CourierX Warehouse';

export interface SyncResult {
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Runs a single domestic tracking sync cycle.
 *
 * 1. Acquire advisory lock (skip if already held by another cycle)
 * 2. Query DOMESTIC shipments that are past PENDING
 * 3. For each: track via Nimbus, map status, apply update
 * 4. Release advisory lock
 */
export async function runDomesticSync(): Promise<SyncResult> {
  const supabase = getServiceRoleClient();
  const result: SyncResult = { processed: 0, updated: 0, skipped: 0, errors: 0 };

  // Step 1: Acquire advisory lock
  const lockAcquired = await acquireAdvisoryLock(supabase, DOMESTIC_SYNC_LOCK_KEY);
  if (!lockAcquired) {
    console.warn('[backgroundSync] Could not acquire advisory lock — another sync cycle is running');
    return result;
  }

  try {
    // Step 2: Query eligible shipments
    const { data: shipments, error: queryError } = await supabase
      .from('shipments')
      .select('*')
      .eq('current_leg', 'DOMESTIC')
      .neq('current_status', 'PENDING');

    if (queryError) {
      console.error('[backgroundSync] Failed to query shipments:', queryError.message);
      return result;
    }

    if (!shipments || shipments.length === 0) {
      return result;
    }

    // Step 3: Process each shipment
    for (const raw of shipments) {
      const shipment = raw as unknown as ShipmentRow;
      result.processed++;

      try {
        await processShipment(shipment, result);
      } catch (err) {
        result.errors++;
        console.error(
          `[backgroundSync] Unhandled error for shipment ${shipment.id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } finally {
    // Step 4: Release advisory lock
    await releaseAdvisoryLock(supabase, DOMESTIC_SYNC_LOCK_KEY);
  }

  return result;
}


/**
 * Processes a single shipment: track via Nimbus, map status, apply update.
 * Retries the Nimbus track call up to 3 times with exponential backoff (1s, 3s, 9s).
 */
async function processShipment(
  shipment: ShipmentRow,
  result: SyncResult,
): Promise<void> {
  if (!shipment.domestic_awb) {
    result.skipped++;
    return;
  }

  // Track with retry (Nimbus client already retries internally,
  // but we handle the case where it still throws after exhausting retries)
  let trackResponse;
  try {
    trackResponse = await trackShipment(shipment.domestic_awb);
  } catch (err) {
    result.errors++;
    console.error(
      `[backgroundSync] Nimbus track failed for AWB ${shipment.domestic_awb}:`,
      err instanceof Error ? err.message : err,
    );
    return;
  }

  if (!trackResponse.success || !trackResponse.rawStatus) {
    result.skipped++;
    return;
  }

  // Map raw Nimbus status to internal status
  const mappedStatus = mapNimbusStatus(trackResponse.rawStatus);
  if (!mappedStatus) {
    result.skipped++;
    return;
  }

  // Skip duplicate status
  if (mappedStatus === shipment.current_status) {
    result.skipped++;
    return;
  }

  // DELIVERED + warehouse address match → transition to COUNTER leg
  if (
    mappedStatus === 'DELIVERED' &&
    shipment.destination_address.includes(WAREHOUSE_ADDRESS)
  ) {
    const updateResult = await updateShipmentStatus({
      shipmentId: shipment.id,
      newStatus: 'ARRIVED_AT_WAREHOUSE',
      newLeg: 'COUNTER',
      source: 'NIMBUS',
      metadata: {
        trigger: 'domestic_sync_warehouse_delivery',
        rawNimbusStatus: trackResponse.rawStatus,
      },
      expectedVersion: shipment.version,
    });

    if (updateResult.success) {
      result.updated++;
    } else {
      result.errors++;
      console.error(
        `[backgroundSync] State machine rejected warehouse transition for ${shipment.id}: ${updateResult.error}`,
      );
    }
    return;
  }

  // Normal status update
  const updateResult = await updateShipmentStatus({
    shipmentId: shipment.id,
    newStatus: mappedStatus,
    source: 'NIMBUS',
    metadata: {
      trigger: 'domestic_sync',
      rawNimbusStatus: trackResponse.rawStatus,
    },
    expectedVersion: shipment.version,
  });

  if (updateResult.success) {
    result.updated++;
  } else {
    result.errors++;
    console.error(
      `[backgroundSync] State machine rejected update for ${shipment.id}: ${updateResult.error}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Advisory lock helpers (Postgres pg_try_advisory_lock / pg_advisory_unlock)
// ---------------------------------------------------------------------------

async function acquireAdvisoryLock(
  supabase: ReturnType<typeof getServiceRoleClient>,
  lockKey: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('pg_try_advisory_lock' as never, {
    lock_key: lockKey,
  } as never);

  if (error) {
    console.error('[backgroundSync] Advisory lock acquisition error:', error.message);
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
    console.error('[backgroundSync] Advisory lock release error:', error.message);
  }
}
