import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentLeg, ShipmentStatus, TimelineSource, ShipmentRow } from '../types';
import { ALLOWED_TRANSITIONS, isTransitionAllowed } from '../transitions';

// ── Mock setup ──────────────────────────────────────────────────────────────

// Mock statusHandler to prevent side effects
vi.mock('../statusHandler', () => ({
  handleStatusChange: vi.fn().mockResolvedValue(undefined),
}));

// Supabase mock state — controlled per-test via helpers
let mockShipmentRow: Partial<ShipmentRow> | null = null;
let mockUpdateResult: { data: Partial<ShipmentRow> | null; error: unknown } = { data: null, error: null };
let mockInsertError: unknown = null;
let insertCalledWith: Record<string, unknown> | null = null;

const mockSingle = vi.fn();
const mockEqChain = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          // SELECT path: .from('shipments').select('*').eq('id', ...).single()
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockShipmentRow,
                error: mockShipmentRow ? null : { message: 'not found' },
              }),
            })),
          })),
          // UPDATE path: .from('shipments').update(payload).eq('id', ...).eq('version', ...).select('*').single()
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue(mockUpdateResult),
                })),
              })),
            })),
          })),
        };
      }
      if (table === 'shipment_timeline') {
        return {
          insert: vi.fn((row: Record<string, unknown>) => {
            insertCalledWith = row;
            return { error: mockInsertError };
          }),
        };
      }
      return {};
    }),
  })),
}));

// ── Arbitraries ─────────────────────────────────────────────────────────────

const ALL_LEGS: ShipmentLeg[] = ['DOMESTIC', 'COUNTER', 'INTERNATIONAL', 'COMPLETED'];
const ALL_STATUSES: ShipmentStatus[] = [
  'PENDING', 'BOOKING_CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'ARRIVED_AT_WAREHOUSE', 'QUALITY_CHECKED', 'PACKAGED', 'DISPATCH_APPROVED',
  'DISPATCHED', 'IN_INTERNATIONAL_TRANSIT', 'CUSTOMS_CLEARANCE', 'INTL_OUT_FOR_DELIVERY', 'INTL_DELIVERED',
  'FAILED',
];
const ALL_SOURCES: TimelineSource[] = ['NIMBUS', 'INTERNAL', 'SIMULATION', 'SYSTEM'];

// Valid (leg, fromStatus, toStatus) triples from ALLOWED_TRANSITIONS
const validTransitions: { leg: ShipmentLeg; fromStatus: ShipmentStatus; toStatus: ShipmentStatus }[] = [];
for (const [leg, statusMap] of Object.entries(ALLOWED_TRANSITIONS) as [ShipmentLeg, Partial<Record<ShipmentStatus, ShipmentStatus[]>>][]) {
  for (const [from, targets] of Object.entries(statusMap) as [ShipmentStatus, ShipmentStatus[]][]) {
    for (const to of targets) {
      validTransitions.push({ leg: leg as ShipmentLeg, fromStatus: from as ShipmentStatus, toStatus: to });
    }
  }
}

const validTransitionArb = fc.constantFrom(...validTransitions);

// Invalid transitions: (leg, fromStatus, toStatus) where toStatus is NOT allowed
const invalidTransitions: { leg: ShipmentLeg; fromStatus: ShipmentStatus; toStatus: ShipmentStatus }[] = [];
for (const leg of ALL_LEGS.filter(l => l !== 'COMPLETED')) {
  const legMap = ALLOWED_TRANSITIONS[leg];
  for (const fromStatus of Object.keys(legMap) as ShipmentStatus[]) {
    const allowed = legMap[fromStatus] ?? [];
    for (const toStatus of ALL_STATUSES) {
      if (toStatus !== fromStatus && !allowed.includes(toStatus)) {
        invalidTransitions.push({ leg, fromStatus, toStatus });
      }
    }
  }
}

const invalidTransitionArb = fc.constantFrom(...invalidTransitions);
const sourceArb = fc.constantFrom(...ALL_SOURCES);
const versionArb = fc.integer({ min: 1, max: 1000 });
const uuidArb = fc.uuid();

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShipmentRow(overrides: Partial<ShipmentRow>): ShipmentRow {
  return {
    id: 'test-id',
    user_id: 'user-1',
    current_leg: 'DOMESTIC',
    current_status: 'PENDING',
    domestic_awb: null,
    international_awb: null,
    version: 1,
    booking_reference_id: null,
    alert_sent: false,
    origin_address: '123 Origin St',
    destination_address: '456 Dest Ave',
    destination_country: 'US',
    recipient_name: 'Test User',
    recipient_phone: '+1234567890',
    weight_kg: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: shipment-lifecycle-management, State Machine Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShipmentRow = null;
    mockUpdateResult = { data: null, error: null };
    mockInsertError = null;
    insertCalledWith = null;
  });

  /**
   * Property 1: Valid transitions succeed and produce a timeline entry
   *
   * For any shipment with a given (current_leg, current_status) pair, and for any
   * newStatus that appears in ALLOWED_TRANSITIONS[current_leg][current_status],
   * calling updateShipmentStatus with a matching version should succeed, increment
   * the version by 1, update the status, and insert exactly one new row in
   * shipment_timeline with the correct shipment_id, status, leg, and source.
   *
   * Validates: Requirements 1.5, 2.3, 3.2, 3.3, 3.4, 4.1, 4.3, 5.3, 6.2
   */
  describe('Property 1: Valid transitions succeed and produce a timeline entry', () => {
    it('should succeed for any valid (leg, fromStatus, toStatus) triple', async () => {
      const { updateShipmentStatus } = await import('../stateMachine');

      await fc.assert(
        fc.asyncProperty(
          validTransitionArb,
          sourceArb,
          versionArb,
          uuidArb,
          async ({ leg, fromStatus, toStatus }, source, version, shipmentId) => {
            const row = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: fromStatus,
              version,
            });

            // Configure mocks
            mockShipmentRow = row;
            const updatedRow = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: toStatus,
              version: version + 1,
            });
            mockUpdateResult = { data: updatedRow, error: null };
            insertCalledWith = null;

            const result = await updateShipmentStatus({
              shipmentId,
              newStatus: toStatus,
              source,
              expectedVersion: version,
            });

            // Should succeed
            expect(result.success).toBe(true);
            // Returned shipment should have incremented version
            expect(result.shipment?.version).toBe(version + 1);
            // Returned shipment should have the new status
            expect(result.shipment?.current_status).toBe(toStatus);
            // Timeline insert should have been called
            expect(insertCalledWith).not.toBeNull();
            expect(insertCalledWith?.shipment_id).toBe(shipmentId);
            expect(insertCalledWith?.status).toBe(toStatus);
            expect(insertCalledWith?.source).toBe(source);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Invalid transitions are rejected
   *
   * For any shipment with a given (current_leg, current_status) pair, and for any
   * newStatus that does NOT appear in ALLOWED_TRANSITIONS[current_leg][current_status],
   * calling updateShipmentStatus should return an error, leave the shipment unchanged
   * (same status, same version), and not insert any row in shipment_timeline.
   *
   * Validates: Requirements 3.5, 3.6, 6.4, 14.2, 14.3, 14.5, 16.4
   */
  describe('Property 2: Invalid transitions are rejected', () => {
    it('should reject any invalid (leg, fromStatus, toStatus) triple', async () => {
      const { updateShipmentStatus } = await import('../stateMachine');

      await fc.assert(
        fc.asyncProperty(
          invalidTransitionArb,
          sourceArb,
          versionArb,
          uuidArb,
          async ({ leg, fromStatus, toStatus }, source, version, shipmentId) => {
            const row = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: fromStatus,
              version,
            });

            mockShipmentRow = row;
            insertCalledWith = null;

            const result = await updateShipmentStatus({
              shipmentId,
              newStatus: toStatus,
              source,
              expectedVersion: version,
            });

            // Should fail
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('INVALID_TRANSITION');
            expect(result.httpStatus).toBe(400);
            // No timeline entry should be inserted
            expect(insertCalledWith).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Completed shipments reject all updates
   *
   * For any shipment where current_leg = 'COMPLETED', and for any status value
   * and source, calling updateShipmentStatus should return an error with HTTP 403
   * and leave the shipment unchanged.
   *
   * Validates: Requirements 5.2, 6.6, 14.4, 16.7
   */
  describe('Property 3: Completed shipments reject all updates', () => {
    it('should reject any update on a COMPLETED shipment with 403', async () => {
      const { updateShipmentStatus } = await import('../stateMachine');

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...ALL_STATUSES),
          sourceArb,
          versionArb,
          uuidArb,
          async (newStatus, source, version, shipmentId) => {
            const row = makeShipmentRow({
              id: shipmentId,
              current_leg: 'COMPLETED',
              current_status: 'INTL_DELIVERED',
              version,
            });

            mockShipmentRow = row;
            insertCalledWith = null;

            const result = await updateShipmentStatus({
              shipmentId,
              newStatus,
              source,
              expectedVersion: version,
            });

            // Should fail with 403
            expect(result.success).toBe(false);
            expect(result.httpStatus).toBe(403);
            expect(result.errorCode).toBe('COMPLETED_SHIPMENT');
            // No timeline entry
            expect(insertCalledWith).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Duplicate status updates are rejected
   *
   * When newStatus === current_status, the state machine should reject with
   * DUPLICATE_STATUS error code and HTTP 400, and not insert a timeline entry.
   *
   * Validates: Requirements 2.4, 6.3
   */
  describe('Property 4: Duplicate status updates are rejected', () => {
    it('should reject when newStatus equals current_status', async () => {
      const { updateShipmentStatus } = await import('../stateMachine');

      // Build (leg, status) pairs that are valid starting states (non-COMPLETED)
      const legStatusPairs: { leg: ShipmentLeg; status: ShipmentStatus }[] = [];
      for (const leg of ALL_LEGS.filter(l => l !== 'COMPLETED')) {
        const legMap = ALLOWED_TRANSITIONS[leg];
        for (const status of Object.keys(legMap) as ShipmentStatus[]) {
          legStatusPairs.push({ leg, status });
        }
      }

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...legStatusPairs),
          sourceArb,
          versionArb,
          uuidArb,
          async ({ leg, status }, source, version, shipmentId) => {
            const row = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: status,
              version,
            });

            mockShipmentRow = row;
            insertCalledWith = null;

            const result = await updateShipmentStatus({
              shipmentId,
              newStatus: status, // same as current
              source,
              expectedVersion: version,
            });

            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('DUPLICATE_STATUS');
            expect(result.httpStatus).toBe(400);
            expect(insertCalledWith).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Version mismatch causes 409 rejection
   *
   * If the expectedVersion in the request does not match the shipment's current
   * version, the state machine should return VERSION_CONFLICT error code with
   * HTTP 409.
   *
   * Validates: Requirements 6.5, 11.4, 16.6
   */
  describe('Property 5: Version mismatch causes 409 rejection', () => {
    it('should reject with 409 when expectedVersion does not match', async () => {
      const { updateShipmentStatus } = await import('../stateMachine');

      await fc.assert(
        fc.asyncProperty(
          validTransitionArb,
          sourceArb,
          versionArb,
          uuidArb,
          async ({ leg, fromStatus, toStatus }, source, version, shipmentId) => {
            const row = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: fromStatus,
              version,
            });

            mockShipmentRow = row;
            insertCalledWith = null;

            // Use a mismatched version (always different from actual)
            const wrongVersion = version + 1;

            const result = await updateShipmentStatus({
              shipmentId,
              newStatus: toStatus,
              source,
              expectedVersion: wrongVersion,
            });

            expect(result.success).toBe(false);
            expect(result.errorCode).toBe('VERSION_CONFLICT');
            expect(result.httpStatus).toBe(409);
            expect(insertCalledWith).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
