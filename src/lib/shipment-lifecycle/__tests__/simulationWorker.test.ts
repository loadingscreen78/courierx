import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow, ShipmentLeg, ShipmentStatus } from '../types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockUpdateShipmentStatus = vi.fn().mockResolvedValue({ success: true });
vi.mock('../stateMachine', () => ({
  updateShipmentStatus: (...args: unknown[]) => mockUpdateShipmentStatus(...args),
}));

let mockQueryResult: { data: Partial<ShipmentRow>[] | null; error: unknown } = { data: [], error: null };
let capturedEqCalls: Array<{ column: string; value: unknown }> = [];

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: unknown) => {
              capturedEqCalls.push({ column: col, value: val });
              return Promise.resolve(mockQueryResult);
            }),
          })),
        };
      }
      return {};
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShipmentRow(overrides: Partial<ShipmentRow> = {}): ShipmentRow {
  return {
    id: 'test-id',
    user_id: 'user-1',
    current_leg: 'INTERNATIONAL',
    current_status: 'DISPATCHED',
    domestic_awb: 'AWB-123',
    international_awb: 'INTL-456',
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

const NON_INTERNATIONAL_LEGS: ShipmentLeg[] = ['DOMESTIC', 'COUNTER', 'COMPLETED'];

const INTERNATIONAL_STATUSES: ShipmentStatus[] = [
  'DISPATCHED',
  'IN_INTERNATIONAL_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'INTL_OUT_FOR_DELIVERY',
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 10: Simulation worker filters by INTERNATIONAL leg only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEqCalls = [];
    mockQueryResult = { data: [], error: null };
  });

  /**
   * Property 10: Simulation worker filters by INTERNATIONAL leg only
   *
   * For any invocation of runSimulationWorker, the Supabase query MUST filter
   * shipments by current_leg = 'INTERNATIONAL'. Shipments on DOMESTIC, COUNTER,
   * or COMPLETED legs are never queried or processed.
   *
   * Validates: Requirements 4.2, 5.1, 5.5
   */

  it('query always filters by current_leg = INTERNATIONAL', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (_run) => {
          capturedEqCalls = [];
          mockQueryResult = { data: [], error: null };

          await runSimulationWorker();

          const legFilters = capturedEqCalls.filter(c => c.column === 'current_leg');
          expect(legFilters.length).toBeGreaterThan(0);
          expect(legFilters).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ column: 'current_leg', value: 'INTERNATIONAL' }),
            ]),
          );
        },
      ),
      { numRuns: 50 },
    );
  });

  it('only INTERNATIONAL-leg shipments are processed by the worker', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...INTERNATIONAL_STATUSES),
        fc.uuid(),
        async (status, shipmentId) => {
          vi.clearAllMocks();
          capturedEqCalls = [];

          const intlShipment = makeShipmentRow({
            id: shipmentId,
            current_leg: 'INTERNATIONAL',
            current_status: status,
          });

          mockQueryResult = { data: [intlShipment], error: null };
          mockUpdateShipmentStatus.mockResolvedValue({ success: true });

          const result = await runSimulationWorker();

          expect(result.processed).toBe(1);
          // The state machine should have been called with source SIMULATION
          if (mockUpdateShipmentStatus.mock.calls.length > 0) {
            expect(mockUpdateShipmentStatus).toHaveBeenCalledWith(
              expect.objectContaining({
                shipmentId,
                source: 'SIMULATION',
              }),
            );
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('non-INTERNATIONAL leg shipments are never returned by the query filter', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...NON_INTERNATIONAL_LEGS),
        async (nonIntlLeg) => {
          vi.clearAllMocks();
          capturedEqCalls = [];
          mockQueryResult = { data: [], error: null };

          await runSimulationWorker();

          const legFilters = capturedEqCalls.filter(c => c.column === 'current_leg');
          expect(legFilters.length).toBeGreaterThan(0);
          for (const filter of legFilters) {
            expect(filter.value).toBe('INTERNATIONAL');
            expect(filter.value).not.toBe(nonIntlLeg);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('when no INTERNATIONAL shipments exist, no status updates are made', async () => {
    const { runSimulationWorker } = await import('../simulationWorker');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (_run) => {
          vi.clearAllMocks();
          capturedEqCalls = [];
          mockQueryResult = { data: [], error: null };

          const result = await runSimulationWorker();

          expect(result.processed).toBe(0);
          expect(result.advanced).toBe(0);
          expect(result.errors).toBe(0);
          expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 25 },
    );
  });
});
