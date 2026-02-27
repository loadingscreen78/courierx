import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow, ShipmentLeg, ShipmentStatus } from '../types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockTrackShipment = vi.fn();
vi.mock('../nimbusClient', () => ({
  trackShipment: (...args: unknown[]) => mockTrackShipment(...args),
}));

const mockUpdateShipmentStatus = vi.fn().mockResolvedValue({ success: true });
vi.mock('../stateMachine', () => ({
  updateShipmentStatus: (...args: unknown[]) => mockUpdateShipmentStatus(...args),
}));

// Track what the Supabase query chain receives
let mockQueryResult: { data: Partial<ShipmentRow>[] | null; error: unknown } = { data: [], error: null };
let capturedEqCalls: Array<{ column: string; value: unknown }> = [];
let capturedNeqCalls: Array<{ column: string; value: unknown }> = [];

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: unknown) => {
              capturedEqCalls.push({ column: col, value: val });
              return {
                neq: vi.fn((neqCol: string, neqVal: unknown) => {
                  capturedNeqCalls.push({ column: neqCol, value: neqVal });
                  return Promise.resolve(mockQueryResult);
                }),
              };
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

const NON_DOMESTIC_LEGS: ShipmentLeg[] = ['COUNTER', 'INTERNATIONAL', 'COMPLETED'];

const DOMESTIC_ACTIVE_STATUSES: ShipmentStatus[] = [
  'BOOKING_CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 9: Background sync filters by DOMESTIC leg only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEqCalls = [];
    capturedNeqCalls = [];
    mockQueryResult = { data: [], error: null };
  });

  /**
   * Property 9: Background sync filters by DOMESTIC leg only
   *
   * For any invocation of runDomesticSync, the Supabase query MUST filter
   * shipments by current_leg = 'DOMESTIC' and current_status != 'PENDING'.
   * Shipments on COUNTER, INTERNATIONAL, or COMPLETED legs are never queried
   * or processed.
   *
   * Validates: Requirements 2.1, 2.6, 2.9, 14.1
   */

  it('query always filters by current_leg = DOMESTIC and current_status != PENDING', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (_run) => {
          capturedEqCalls = [];
          capturedNeqCalls = [];
          mockQueryResult = { data: [], error: null };

          await runDomesticSync();

          // The query must filter by current_leg = 'DOMESTIC'
          expect(capturedEqCalls).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ column: 'current_leg', value: 'DOMESTIC' }),
            ]),
          );

          // The query must exclude PENDING status
          expect(capturedNeqCalls).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ column: 'current_status', value: 'PENDING' }),
            ]),
          );
        },
      ),
      { numRuns: 50 },
    );
  });

  it('only DOMESTIC-leg shipments are processed by the sync', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DOMESTIC_ACTIVE_STATUSES),
        fc.uuid(),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (status, shipmentId, awb) => {
          vi.clearAllMocks();
          capturedEqCalls = [];
          capturedNeqCalls = [];

          const domesticShipment = makeShipmentRow({
            id: shipmentId,
            current_leg: 'DOMESTIC',
            current_status: status,
            domestic_awb: `AWB-${awb}`,
          });

          mockQueryResult = { data: [domesticShipment], error: null };
          mockTrackShipment.mockResolvedValue({
            success: true,
            rawStatus: 'In Transit',
          });

          const result = await runDomesticSync();

          // Should have processed exactly 1 shipment
          expect(result.processed).toBe(1);

          // Nimbus trackShipment should have been called with the domestic AWB
          expect(mockTrackShipment).toHaveBeenCalledWith(`AWB-${awb}`);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('non-DOMESTIC leg shipments are never returned by the query filter', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...NON_DOMESTIC_LEGS),
        async (nonDomesticLeg) => {
          vi.clearAllMocks();
          capturedEqCalls = [];
          capturedNeqCalls = [];

          // Even if the DB somehow returned a non-DOMESTIC shipment,
          // the query itself filters by DOMESTIC. We verify the filter is applied.
          mockQueryResult = { data: [], error: null };

          await runDomesticSync();

          // The eq filter must always be for DOMESTIC, never for the non-domestic leg
          const legFilters = capturedEqCalls.filter(c => c.column === 'current_leg');
          expect(legFilters.length).toBeGreaterThan(0);
          for (const filter of legFilters) {
            expect(filter.value).toBe('DOMESTIC');
            expect(filter.value).not.toBe(nonDomesticLeg);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('when no DOMESTIC shipments exist, no tracking calls are made', async () => {
    const { runDomesticSync } = await import('../backgroundSync');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (_run) => {
          vi.clearAllMocks();
          capturedEqCalls = [];
          capturedNeqCalls = [];
          mockQueryResult = { data: [], error: null };

          const result = await runDomesticSync();

          expect(result.processed).toBe(0);
          expect(result.updated).toBe(0);
          expect(result.errors).toBe(0);
          expect(mockTrackShipment).not.toHaveBeenCalled();
          expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 25 },
    );
  });
});
