import { ShipmentLeg, ShipmentStatus, TimelineSource, ShipmentRow } from './types';
import { isTransitionAllowed } from './transitions';
import { getServiceRoleClient } from './supabaseAdmin';

export interface StatusUpdateRequest {
  shipmentId: string;
  newStatus: ShipmentStatus;
  newLeg?: ShipmentLeg;
  source: TimelineSource;
  metadata?: Record<string, unknown>;
  expectedVersion: number;
}

export interface StatusUpdateResult {
  success: boolean;
  error?: string;
  errorCode?: 'COMPLETED_SHIPMENT' | 'INVALID_TRANSITION' | 'VERSION_CONFLICT' | 'DUPLICATE_STATUS';
  httpStatus?: number;
  shipment?: ShipmentRow;
}

/**
 * The sole entry point for all shipment status changes.
 *
 * 1. SELECT the shipment row using the service role client
 * 2. Reject if current_leg is COMPLETED → 403
 * 3. Reject if newStatus === current_status (duplicate) → 400
 * 4. Validate transition via isTransitionAllowed → 400
 * 5. Check expectedVersion matches the row's version → 409
 * 6. UPDATE shipment with version check in WHERE clause (atomic CAS)
 * 7. INSERT into shipment_timeline
 * 8. Call handleStatusChange for side effects
 */
export async function updateShipmentStatus(
  req: StatusUpdateRequest
): Promise<StatusUpdateResult> {
  const supabase = getServiceRoleClient();

  // Step 1: Read current shipment state
  const { data: shipment, error: selectError } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', req.shipmentId)
    .single();

  if (selectError || !shipment) {
    return {
      success: false,
      error: `Shipment not found: ${req.shipmentId}`,
      httpStatus: 404,
    };
  }

  const row = shipment as unknown as ShipmentRow;

  // Step 2: Reject if completed
  if (row.current_leg === 'COMPLETED') {
    return {
      success: false,
      error: 'Shipment is completed and locked',
      errorCode: 'COMPLETED_SHIPMENT',
      httpStatus: 403,
    };
  }

  // Step 3: Reject duplicate status
  if (req.newStatus === row.current_status) {
    return {
      success: false,
      error: `Status is already ${row.current_status}`,
      errorCode: 'DUPLICATE_STATUS',
      httpStatus: 400,
    };
  }

  // Step 4: Validate transition
  if (!isTransitionAllowed(row.current_leg, row.current_status, req.newStatus)) {
    return {
      success: false,
      error: `Transition from ${row.current_status} to ${req.newStatus} is not allowed in ${row.current_leg} leg`,
      errorCode: 'INVALID_TRANSITION',
      httpStatus: 400,
    };
  }

  // Step 5: Check version
  if (req.expectedVersion !== row.version) {
    return {
      success: false,
      error: 'Concurrent modification detected, retry with current version',
      errorCode: 'VERSION_CONFLICT',
      httpStatus: 409,
    };
  }

  // Step 6: Atomic UPDATE with version check in WHERE clause
  const updatePayload: Record<string, unknown> = {
    current_status: req.newStatus,
    version: row.version + 1,
  };
  if (req.newLeg) {
    updatePayload.current_leg = req.newLeg;
  }

  const { data: updated, error: updateError } = await supabase
    .from('shipments')
    .update(updatePayload)
    .eq('id', req.shipmentId)
    .eq('version', row.version)
    .select('*')
    .single();

  if (updateError || !updated) {
    // If the update affected 0 rows, another process changed the version
    return {
      success: false,
      error: 'Concurrent modification detected, retry with current version',
      errorCode: 'VERSION_CONFLICT',
      httpStatus: 409,
    };
  }

  const updatedRow = updated as unknown as ShipmentRow;

  // Step 7: Insert timeline entry
  const { error: timelineError } = await supabase
    .from('shipment_timeline')
    .insert({
      shipment_id: req.shipmentId,
      status: req.newStatus,
      leg: updatedRow.current_leg,
      source: req.source,
      metadata: req.metadata ?? {},
    });

  if (timelineError) {
    console.error('[stateMachine] Failed to insert timeline entry:', timelineError);
  }

  // Step 8: Call handleStatusChange for side effects
  try {
    const { handleStatusChange } = await import('./statusHandler');
    await handleStatusChange(updatedRow, req.newStatus, updatedRow.current_leg);
  } catch (err) {
    // statusHandler may not exist yet (task 5.2) — log and continue
    console.error('[stateMachine] handleStatusChange error:', err);
  }

  return {
    success: true,
    shipment: updatedRow,
  };
}
