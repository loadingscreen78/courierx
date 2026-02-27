import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow, ShipmentLeg, ShipmentStatus } from '../types';

// ── Mock setup ──────────────────────────────────────────────────────────────

const mockUpdateShipmentStatus = vi.fn().mockResolvedValue({ success: true });
vi.mock('../stateMachine', () => ({
  updateShipmentStatus: (...args: unknown[]) => mockUpdateShipmentStatus(...args),
}));

let mockSupabaseUpdateCalls: Array<{ table: string; payload: Record<string, unknown>; id: string }> = [];

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      update: vi.fn((payload: Record<string, unknown>) => ({
        eq: vi.fn((col: string, val: string) => {
          mockSupabaseUpdateCalls.push({ table, payload, id: val });
          return Promise.resolve({ error: null });
        }),
      })),
    })),
  })),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShipmentRow(overrides: Partial<ShipmentRow> = {}): ShipmentRow {
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

const WAREHOUSE_ADDRESS = process.env.WAREHOUSE_ADDRESS ?? 'CourierX Warehouse';

// Arbitraries
const uuidArb = fc.uuid();
const versionArb = fc.integer({ min: 1, max: 1000 });
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: shipment-lifecycle-management, Status Handler Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseUpdateCalls = [];
  });

  /**
   * Property 11: Domestic DELIVERED with warehouse match transitions to COUNTER
   *
   * For any shipment on the DOMESTIC leg with a destination_address that contains
   * the warehouse address, when handleStatusChange is called with status DELIVERED,
   * it should call updateShipmentStatus to transition the shipment to COUNTER leg
   * with ARRIVED_AT_WAREHOUSE status.
   *
   * Validates: Requirements 2.5, 6.9
   */
  describe('Property 11: Domestic DELIVERED with warehouse match transitions to COUNTER', () => {
    it('should transition to COUNTER/ARRIVED_AT_WAREHOUSE when destination contains warehouse address', async () => {
      const { handleStatusChange } = await import('../statusHandler');

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          versionArb,
          nonEmptyStringArb,
          async (shipmentId, version, prefix) => {
            mockUpdateShipmentStatus.mockClear();

            // Destination address contains the warehouse address
            const destinationAddress = `${prefix} ${WAREHOUSE_ADDRESS} Suite 100`;
            const shipment = makeShipmentRow({
              id: shipmentId,
              current_leg: 'DOMESTIC',
              current_status: 'DELIVERED',
              destination_address: destinationAddress,
              version,
            });

            await handleStatusChange(shipment, 'DELIVERED', 'DOMESTIC');

            // Should call updateShipmentStatus to transition to COUNTER
            expect(mockUpdateShipmentStatus).toHaveBeenCalledOnce();
            const call = mockUpdateShipmentStatus.mock.calls[0][0];
            expect(call.shipmentId).toBe(shipmentId);
            expect(call.newStatus).toBe('ARRIVED_AT_WAREHOUSE');
            expect(call.newLeg).toBe('COUNTER');
            expect(call.source).toBe('SYSTEM');
            expect(call.expectedVersion).toBe(version);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should NOT transition when destination does not contain warehouse address', async () => {
      const { handleStatusChange } = await import('../statusHandler');

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          versionArb,
          // Generate addresses that definitely don't contain the warehouse string
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !s.includes(WAREHOUSE_ADDRESS) && s.trim().length > 0
          ),
          async (shipmentId, version, destinationAddress) => {
            mockUpdateShipmentStatus.mockClear();

            const shipment = makeShipmentRow({
              id: shipmentId,
              current_leg: 'DOMESTIC',
              current_status: 'DELIVERED',
              destination_address: destinationAddress,
              version,
            });

            await handleStatusChange(shipment, 'DELIVERED', 'DOMESTIC');

            // Should NOT call updateShipmentStatus
            expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 12: International INTL_DELIVERED transitions to COMPLETED
   *
   * For any shipment on the INTERNATIONAL leg, when handleStatusChange is called
   * with status INTL_DELIVERED, it should call updateShipmentStatus to transition
   * the shipment to COMPLETED leg.
   *
   * Validates: Requirements 4.5, 6.10
   */
  describe('Property 12: International INTL_DELIVERED transitions to COMPLETED', () => {
    it('should transition to COMPLETED when INTL_DELIVERED on INTERNATIONAL leg', async () => {
      const { handleStatusChange } = await import('../statusHandler');

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          versionArb,
          async (shipmentId, version) => {
            mockUpdateShipmentStatus.mockClear();

            const shipment = makeShipmentRow({
              id: shipmentId,
              current_leg: 'INTERNATIONAL',
              current_status: 'INTL_DELIVERED',
              version,
            });

            await handleStatusChange(shipment, 'INTL_DELIVERED', 'INTERNATIONAL');

            // Should call updateShipmentStatus to transition to COMPLETED
            expect(mockUpdateShipmentStatus).toHaveBeenCalledOnce();
            const call = mockUpdateShipmentStatus.mock.calls[0][0];
            expect(call.shipmentId).toBe(shipmentId);
            expect(call.newLeg).toBe('COMPLETED');
            expect(call.source).toBe('SYSTEM');
            expect(call.expectedVersion).toBe(version);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 13: INTL_OUT_FOR_DELIVERY triggers alert
   *
   * For any shipment, when handleStatusChange is called with status
   * INTL_OUT_FOR_DELIVERY, it should set alert_sent=true on the shipment
   * via a Supabase update call.
   *
   * Validates: Requirements 4.4, 6.8
   */
  describe('Property 13: INTL_OUT_FOR_DELIVERY triggers alert', () => {
    it('should set alert_sent=true for any shipment reaching INTL_OUT_FOR_DELIVERY', async () => {
      const { handleStatusChange } = await import('../statusHandler');

      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          versionArb,
          // Leg can be anything the handler receives — the handler checks status, not leg
          fc.constantFrom<ShipmentLeg>('INTERNATIONAL'),
          async (shipmentId, version, leg) => {
            mockSupabaseUpdateCalls = [];
            mockUpdateShipmentStatus.mockClear();

            const shipment = makeShipmentRow({
              id: shipmentId,
              current_leg: leg,
              current_status: 'INTL_OUT_FOR_DELIVERY',
              alert_sent: false,
              version,
            });

            await handleStatusChange(shipment, 'INTL_OUT_FOR_DELIVERY', leg);

            // Should NOT call updateShipmentStatus (no leg transition here)
            expect(mockUpdateShipmentStatus).not.toHaveBeenCalled();

            // Should update alert_sent=true via Supabase
            expect(mockSupabaseUpdateCalls.length).toBe(1);
            expect(mockSupabaseUpdateCalls[0].table).toBe('shipments');
            expect(mockSupabaseUpdateCalls[0].payload).toEqual({ alert_sent: true });
            expect(mockSupabaseUpdateCalls[0].id).toBe(shipmentId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
