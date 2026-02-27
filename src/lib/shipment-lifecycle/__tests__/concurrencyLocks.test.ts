import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow, ShipmentStatus } from '../types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockTrackShipment = vi.fn();
vi.mock('../nimbusClient', () => ({
  trackShipment: (...args: unknown[]) => mockTrackShipment(...args),
}));

const mockUpdateShipmentStatus = vi.fn().mockResolvedValue({ success: true });
vi.mock('../stateMachine', () => ({
  updateShipmentStatus: (...args: unknown[]) => mockUpdateShipmentStatus(...args),
}));

// Track advisory lock rpc calls
let rpcCalls: Array<{ fnName: string; args: Record<string, unknown> }> = [];
let advisoryLockBehavior: 'granted' | 'denied' = 'granted';

// Separate query results for background sync and simulation worker
let bgSyncQueryResult: { data: Partial<ShipmentRow>[] | null; error: unknown } = { data: [], error: null };
let simQueryResult: { data: Partial<ShipmentRow>[] | null; error: unknown } = { data: [], error: null };

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: unknown) => {
              if (val === 'DOMESTIC') {
                return {
                  neq: vi.fn(() => Promise.resolve(bgSyncQueryResult)),
                };
              }
              if (val === 'INTERNATIONAL') {
                return Promise.resolve(simQueryResult);
              }
              return Promise.resolve({ data: [], error: null });
            }),
          })),
        };
      }
      return {};
    }),
    rpc: vi.fn((fnName: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fnName, args });
      const granted = advisoryLockBehavior === 'granted';
      return Promise.resolve({ data: granted, error: null });
    }),
  })),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShipmentRow(overrides: Partial<ShipmentRow> = {}): ShipmentRow {
  return {
    id: 'test-id',
    user_id: 'user-1',
    current_leg: 'DOMESTIC',
    current_status: 'BOOKING_CONFIRMED',
    domestic_awb: 'AWB-123',
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

const DOMESTIC_ACTIVE_STATUSES: ShipmentStatus[] = [
  'BOOKING_CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
];

const INTERNATIONAL_STATUSES: ShipmentStatus[] = [
  'DISPATCHED',
  'IN_INTERNATIONAL_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'INTL_OUT_FOR_DELIVERY',
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 19: Concurrency locks prevent overlapping worker execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcCalls = [];
    advisoryLockBehavior = 'granted';
    bgSyncQueryResult = { data: [], error: null };
    simQueryResult = { data: [], error: null };
  });

  /**
   * Property 19: Concurrency locks prevent overlapping worker execution
   *
   * For any invocation of runDomesticSync, the function MUST acquire a
   * Postgres advisory lock before processing and release it after.
   * If the lock cannot be acquired (another cycle is running), the function
   * MUST return immediately without processing any shipments.
   *
   * For any invocation of runSimulationWorker, the function MUST acquire a
   * per-shipment advisory lock before advancing each shipment and release
   * it after. If the lock cannot be acquired, the shipment MUST be skipped.
   *
   * Validates: Requirements 2.8, 4.7, 11.2, 11.5
   */

  // ── Background Sync: global advisory lock ─────────────────────────────

  it('domestic sync acquires and releases advisory lock on every invocation', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }),
        async (shipmentCount) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'granted';

          const shipments = Array.from({ length: shipmentCount }, (_, i) =>
            makeShipmentRow({
              id: `ship-${i}`,
              current_leg: 'DOMESTIC',
              current_status: 'BOOKING_CONFIRMED',
              domestic_awb: `AWB-${i}`,
            }),
          );
          bgSyncQueryResult = { data: shipments, error: null };
          mockTrackShipment.mockResolvedValue({ success: true, rawStatus: 'In Transit' });

          await runDomesticSync();

          // Must have at least one lock acquire and one lock release call
          const lockCalls = rpcCalls.filter(c => c.fnName === 'pg_try_advisory_lock');
          const unlockCalls = rpcCalls.filter(c => c.fnName === 'pg_advisory_unlock');

          expect(lockCalls.length).toBeGreaterThanOrEqual(1);
          expect(unlockCalls.length).toBeGreaterThanOrEqual(1);

          // Lock is acquired before unlock (by call order)
          const firstLockIdx = rpcCalls.findIndex(c => c.fnName === 'pg_try_advisory_lock');
          const lastUnlockIdx = rpcCalls.length - 1 - [...rpcCalls].reverse().findIndex(c => c.fnName === 'pg_advisory_unlock');
          expect(firstLockIdx).toBeLessThan(lastUnlockIdx);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('domestic sync skips all processing when advisory lock is denied', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DOMESTIC_ACTIVE_STATUSES),
        fc.uuid(),
        async (status, shipmentId) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'denied';

          // Even with shipments available, nothing should be processed
          bgSyncQueryResult = {
            data: [makeShipmentRow({ id: shipmentId, current_status: status, domestic_awb: 'AWB-X' })],
            error: null,
          };

          const result = await runDomesticSync();

          // No shipments processed when lock is denied
          expect(result.processed).toBe(0);
          expect(result.updated).toBe(0);
          expect(result.errors).toBe(0);

          // Nimbus API should never be called
          expect(mockTrackShipment).not.toHaveBeenCalled();
          // State machine should never be called
          expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 50 },
    );
  });

  it('domestic sync uses a consistent lock key across invocations', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    const observedLockKeys: unknown[] = [];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (_run) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'granted';
          bgSyncQueryResult = { data: [], error: null };

          await runDomesticSync();

          const lockCall = rpcCalls.find(c => c.fnName === 'pg_try_advisory_lock');
          if (lockCall) {
            observedLockKeys.push(lockCall.args);
          }
        },
      ),
      { numRuns: 10 },
    );

    // All invocations should use the same lock key
    if (observedLockKeys.length > 1) {
      const first = JSON.stringify(observedLockKeys[0]);
      for (const key of observedLockKeys) {
        expect(JSON.stringify(key)).toBe(first);
      }
    }
  });

  // ── Simulation Worker: per-shipment advisory locks ────────────────────

  it('simulation worker acquires and releases a per-shipment lock for each shipment', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        fc.constantFrom(...INTERNATIONAL_STATUSES),
        async (count, status) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'granted';

          const shipments = Array.from({ length: count }, (_, i) =>
            makeShipmentRow({
              id: `intl-ship-${i}-${crypto.randomUUID().slice(0, 8)}`,
              current_leg: 'INTERNATIONAL',
              current_status: status,
              international_awb: `INTL-${i}`,
            }),
          );
          simQueryResult = { data: shipments, error: null };
          mockUpdateShipmentStatus.mockResolvedValue({ success: true });

          await runSimulationWorker();

          // For each shipment, there should be a lock acquire and release
          const lockCalls = rpcCalls.filter(c => c.fnName === 'pg_try_advisory_lock');
          const unlockCalls = rpcCalls.filter(c => c.fnName === 'pg_advisory_unlock');

          // At least one lock/unlock per shipment processed
          expect(lockCalls.length).toBeGreaterThanOrEqual(count);
          expect(unlockCalls.length).toBeGreaterThanOrEqual(count);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('simulation worker skips shipment when per-shipment lock is denied', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...INTERNATIONAL_STATUSES),
        fc.uuid(),
        async (status, shipmentId) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'denied';

          simQueryResult = {
            data: [makeShipmentRow({
              id: shipmentId,
              current_leg: 'INTERNATIONAL',
              current_status: status,
              international_awb: 'INTL-X',
            })],
            error: null,
          };

          const result = await runSimulationWorker();

          // Shipment is counted as processed but not advanced
          expect(result.processed).toBe(1);
          expect(result.advanced).toBe(0);

          // State machine should never be called when lock is denied
          expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 50 },
    );
  });

  it('simulation worker uses distinct lock keys for different shipments', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 4 }),
        async (shipmentIds) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'granted';

          const shipments = shipmentIds.map(id =>
            makeShipmentRow({
              id,
              current_leg: 'INTERNATIONAL',
              current_status: 'DISPATCHED',
              international_awb: `INTL-${id.slice(0, 8)}`,
            }),
          );
          simQueryResult = { data: shipments, error: null };
          mockUpdateShipmentStatus.mockResolvedValue({ success: true });

          await runSimulationWorker();

          // Collect all lock keys used for acquiring locks
          const lockKeys = rpcCalls
            .filter(c => c.fnName === 'pg_try_advisory_lock')
            .map(c => JSON.stringify(c.args));

          // Each shipment should get a distinct lock key
          const uniqueKeys = new Set(lockKeys);
          expect(uniqueKeys.size).toBe(shipmentIds.length);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('lock is always released even when shipment processing throws', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (shipmentId) => {
          vi.clearAllMocks();
          rpcCalls = [];
          advisoryLockBehavior = 'granted';

          simQueryResult = {
            data: [makeShipmentRow({
              id: shipmentId,
              current_leg: 'INTERNATIONAL',
              current_status: 'DISPATCHED',
              international_awb: 'INTL-ERR',
            })],
            error: null,
          };

          // Make the state machine fail — the worker retries once then skips
          mockUpdateShipmentStatus.mockRejectedValue(new Error('DB connection lost'));

          await runSimulationWorker();

          // Even on error, the lock must be released
          const unlockCalls = rpcCalls.filter(c => c.fnName === 'pg_advisory_unlock');
          expect(unlockCalls.length).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 30 },
    );
  });
});
