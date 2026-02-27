import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow, ShipmentLeg, ShipmentStatus } from '../types';

// ── Mock setup ──────────────────────────────────────────────────────────────

let mockQueryResult: { data: Partial<ShipmentRow>[] | null; error: unknown } = { data: [], error: null };
let mockInsertResult: { error: unknown } = { error: null };
let capturedEqCalls: Array<{ column: string; value: unknown }> = [];
let capturedLtCalls: Array<{ column: string; value: unknown }> = [];
let capturedInserts: Array<Record<string, unknown>> = [];

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: unknown) => {
              capturedEqCalls.push({ column: col, value: val });
              return {
                lt: vi.fn((ltCol: string, ltVal: unknown) => {
                  capturedLtCalls.push({ column: ltCol, value: ltVal });
                  return Promise.resolve(mockQueryResult);
                }),
              };
            }),
          })),
        };
      }
      if (table === 'shipment_timeline') {
        return {
          insert: vi.fn((row: Record<string, unknown>) => {
            capturedInserts.push(row);
            return Promise.resolve(mockInsertResult);
          }),
        };
      }
      return {};
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

const DOMESTIC_STATUSES: ShipmentStatus[] = [
  'PENDING',
  'BOOKING_CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
];

const NON_DOMESTIC_LEGS: ShipmentLeg[] = ['COUNTER', 'INTERNATIONAL', 'COMPLETED'];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 22: Stuck shipment detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEqCalls = [];
    capturedLtCalls = [];
    capturedInserts = [];
    mockQueryResult = { data: [], error: null };
    mockInsertResult = { error: null };
  });

  /**
   * Property 22: Stuck shipment detection
   *
   * For any shipment where current_leg = 'DOMESTIC' and created_at is more
   * than 48 hours ago, the system should flag it as stuck for operator review
   * by inserting a SYSTEM timeline entry with alert_type = 'stuck_shipment'.
   *
   * Validates: Requirements 12.3
   */

  it('query always filters by current_leg = DOMESTIC and created_at < 48h cutoff', async () => {
    const { detectStuckShipments } = await import('../stuckShipmentDetector');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (_run) => {
          capturedEqCalls = [];
          capturedLtCalls = [];
          mockQueryResult = { data: [], error: null };

          await detectStuckShipments();

          // Must filter by current_leg = 'DOMESTIC'
          expect(capturedEqCalls).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ column: 'current_leg', value: 'DOMESTIC' }),
            ]),
          );

          // Must filter by created_at < cutoff (48h ago)
          expect(capturedLtCalls).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ column: 'created_at' }),
            ]),
          );

          // Verify the cutoff is approximately 48 hours ago (within 5 seconds tolerance)
          const ltCall = capturedLtCalls.find(c => c.column === 'created_at');
          expect(ltCall).toBeDefined();
          const cutoffDate = new Date(ltCall!.value as string).getTime();
          const expected48hAgo = Date.now() - 48 * 60 * 60 * 1000;
          expect(Math.abs(cutoffDate - expected48hAgo)).toBeLessThan(5000);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('flags every stuck DOMESTIC shipment with a SYSTEM timeline entry', async () => {
    const { detectStuckShipments } = await import('../stuckShipmentDetector');

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DOMESTIC_STATUSES),
        fc.uuid(),
        fc.integer({ min: 49, max: 200 }),
        async (status, shipmentId, ageHours) => {
          vi.clearAllMocks();
          capturedInserts = [];
          mockInsertResult = { error: null };

          const stuckCreatedAt = new Date(Date.now() - ageHours * 60 * 60 * 1000).toISOString();
          const stuckShipment = makeShipmentRow({
            id: shipmentId,
            current_leg: 'DOMESTIC',
            current_status: status,
            created_at: stuckCreatedAt,
          });

          mockQueryResult = { data: [stuckShipment], error: null };

          const result = await detectStuckShipments();

          // Should detect and flag exactly 1 shipment
          expect(result.detected).toBe(1);
          expect(result.flagged).toBe(1);
          expect(result.errors).toBe(0);

          // A timeline entry should have been inserted
          expect(capturedInserts.length).toBe(1);
          const entry = capturedInserts[0];
          expect(entry.shipment_id).toBe(shipmentId);
          expect(entry.source).toBe('SYSTEM');
          expect(entry.leg).toBe('DOMESTIC');
          expect(entry.status).toBe(status);
          expect((entry.metadata as Record<string, unknown>).alert_type).toBe('stuck_shipment');
          expect((entry.metadata as Record<string, unknown>).threshold_hours).toBe(48);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('returns zero detections when no shipments are stuck', async () => {
    const { detectStuckShipments } = await import('../stuckShipmentDetector');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (_run) => {
          vi.clearAllMocks();
          capturedInserts = [];
          mockQueryResult = { data: [], error: null };

          const result = await detectStuckShipments();

          expect(result.detected).toBe(0);
          expect(result.flagged).toBe(0);
          expect(result.errors).toBe(0);
          expect(capturedInserts.length).toBe(0);
        },
      ),
      { numRuns: 25 },
    );
  });

  it('counts errors when timeline insert fails for a stuck shipment', async () => {
    const { detectStuckShipments } = await import('../stuckShipmentDetector');

    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.constantFrom(...DOMESTIC_STATUSES),
        async (shipmentId, status) => {
          vi.clearAllMocks();
          capturedInserts = [];

          const stuckCreatedAt = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
          const stuckShipment = makeShipmentRow({
            id: shipmentId,
            current_leg: 'DOMESTIC',
            current_status: status,
            created_at: stuckCreatedAt,
          });

          mockQueryResult = { data: [stuckShipment], error: null };
          mockInsertResult = { error: { message: 'insert failed' } };

          const result = await detectStuckShipments();

          expect(result.detected).toBe(1);
          expect(result.flagged).toBe(0);
          expect(result.errors).toBe(1);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('handles multiple stuck shipments and flags each independently', async () => {
    const { detectStuckShipments } = await import('../stuckShipmentDetector');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (count) => {
          vi.clearAllMocks();
          capturedInserts = [];
          mockInsertResult = { error: null };

          const shipments = Array.from({ length: count }, (_, i) =>
            makeShipmentRow({
              id: `stuck-${i}`,
              current_leg: 'DOMESTIC',
              current_status: DOMESTIC_STATUSES[i % DOMESTIC_STATUSES.length],
              created_at: new Date(Date.now() - (50 + i) * 60 * 60 * 1000).toISOString(),
            }),
          );

          mockQueryResult = { data: shipments, error: null };

          const result = await detectStuckShipments();

          expect(result.detected).toBe(count);
          expect(result.flagged).toBe(count);
          expect(result.errors).toBe(0);
          expect(capturedInserts.length).toBe(count);

          // Each insert should reference a unique shipment
          const insertedIds = capturedInserts.map(e => e.shipment_id);
          expect(new Set(insertedIds).size).toBe(count);
        },
      ),
      { numRuns: 30 },
    );
  });
});
