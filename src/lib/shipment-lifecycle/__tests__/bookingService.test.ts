import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow } from '../types';

// ── Mock state ──────────────────────────────────────────────────────────────

let mockExistingShipment: Partial<ShipmentRow> | null = null;
let mockInsertedRow: Record<string, unknown> | null = null;
let mockInsertError: unknown = null;
let mockUpdateCalls: Array<{ payload: Record<string, unknown>; id: string }> = [];

// Track what was inserted so we can verify initial state
let capturedInsertPayload: Record<string, unknown> | null = null;

// ── Supabase mock ───────────────────────────────────────────────────────────

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          // SELECT path for idempotency check:
          // .from('shipments').select('*').eq('booking_reference_id', ...).maybeSingle()
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockExistingShipment,
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data: mockExistingShipment,
                error: mockExistingShipment ? null : { message: 'not found' },
              }),
            })),
          })),
          // INSERT path:
          // .from('shipments').insert({...}).select('*').single()
          insert: vi.fn((payload: Record<string, unknown>) => {
            capturedInsertPayload = { ...payload };
            const row = {
              id: 'generated-uuid',
              ...payload,
              domestic_awb: null,
              international_awb: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            mockInsertedRow = row;
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockInsertError ? null : row,
                  error: mockInsertError,
                }),
              })),
            };
          }),
          // UPDATE path:
          // .from('shipments').update({...}).eq('id', ...)
          update: vi.fn((payload: Record<string, unknown>) => {
            const eqFn = vi.fn((field: string, value: unknown) => {
              mockUpdateCalls.push({ payload, id: String(value) });
              return {
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  })),
                })),
              };
            });
            return { eq: eqFn };
          }),
        };
      }
      return {};
    }),
  })),
}));

// ── Nimbus client mock ──────────────────────────────────────────────────────

vi.mock('../nimbusClient', () => ({
  createShipment: vi.fn().mockResolvedValue({
    success: true,
    awb: 'AWB-MOCK-12345',
  }),
}));

// ── State machine mock ──────────────────────────────────────────────────────

vi.mock('../stateMachine', () => ({
  updateShipmentStatus: vi.fn().mockResolvedValue({
    success: true,
    shipment: {
      id: 'generated-uuid',
      current_status: 'BOOKING_CONFIRMED',
      current_leg: 'DOMESTIC',
      version: 2,
    },
  }),
}));

// ── Arbitraries ─────────────────────────────────────────────────────────────

const validBookingArb = fc.record({
  bookingReferenceId: fc.string({ minLength: 1, maxLength: 64, unit: 'grapheme' }).map(s => s.replace(/[^\w-]/g, 'a') || 'a'),
  recipientName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  recipientPhone: fc.constantFrom('+14155551234', '+919876543210', '+442071234567', '14155551234'),
  originAddress: fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationAddress: fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationCountry: fc.string({ minLength: 2, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w]/g, 'ab').slice(0, 50) || 'ab'),
  weightKg: fc.double({ min: 0.01, max: 30, noNaN: true, noDefaultInfinity: true }),
  declaredValue: fc.double({ min: 0.01, max: 999999, noNaN: true, noDefaultInfinity: true }),
  shipmentType: fc.constantFrom('medicine' as const, 'document' as const, 'gift' as const),
});

const userIdArb = fc.uuid();

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeShipmentRow(overrides: Partial<ShipmentRow>): ShipmentRow {
  return {
    id: 'generated-uuid',
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

describe('Feature: shipment-lifecycle-management, Booking Service Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistingShipment = null;
    mockInsertedRow = null;
    mockInsertError = null;
    mockUpdateCalls = [];
    capturedInsertPayload = null;
  });

  /**
   * Property 6: Booking idempotency
   *
   * For any valid booking request with a given bookingReferenceId, calling
   * createBooking twice with the same bookingReferenceId should return the
   * same shipment record both times, and only one shipment row should exist
   * in the database for that reference.
   *
   * **Validates: Requirements 1.2, 1.8**
   */
  describe('Property 6: Booking idempotency', () => {
    it('should return existing shipment when bookingReferenceId already exists', async () => {
      const { createBooking } = await import('../bookingService');

      await fc.assert(
        fc.asyncProperty(
          validBookingArb,
          userIdArb,
          async (booking, userId) => {
            // Simulate an existing shipment for this bookingReferenceId
            const existingShipment = makeShipmentRow({
              id: 'existing-shipment-id',
              user_id: userId,
              booking_reference_id: booking.bookingReferenceId,
              current_status: 'BOOKING_CONFIRMED',
              current_leg: 'DOMESTIC',
              version: 2,
              domestic_awb: 'AWB-EXISTING',
              recipient_name: booking.recipientName,
              recipient_phone: booking.recipientPhone,
              origin_address: booking.originAddress,
              destination_address: booking.destinationAddress,
              destination_country: booking.destinationCountry,
              weight_kg: booking.weightKg,
            });

            // Configure mock: idempotency check returns existing shipment
            mockExistingShipment = existingShipment;
            capturedInsertPayload = null;

            const result = await createBooking({
              userId,
              ...booking,
            });

            // Should succeed and return the existing shipment
            expect(result.success).toBe(true);
            expect(result.shipment).toBeDefined();
            expect(result.shipment!.id).toBe('existing-shipment-id');
            expect(result.shipment!.booking_reference_id).toBe(booking.bookingReferenceId);

            // No insert should have been called (idempotent — reused existing)
            expect(capturedInsertPayload).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 18: New bookings start with correct initial state
   *
   * For any valid booking request, the created shipment row should have
   * current_leg = 'DOMESTIC', current_status = 'PENDING', version = 1,
   * alert_sent = false, and domestic_awb = null.
   *
   * **Validates: Requirements 1.3**
   */
  describe('Property 18: New bookings start with correct initial state', () => {
    it('should create shipment with PENDING status, DOMESTIC leg, version 1, alert_sent false, and null domestic_awb', async () => {
      const { createBooking } = await import('../bookingService');

      await fc.assert(
        fc.asyncProperty(
          validBookingArb,
          userIdArb,
          async (booking, userId) => {
            // No existing shipment — fresh booking
            mockExistingShipment = null;
            capturedInsertPayload = null;

            await createBooking({
              userId,
              ...booking,
            });

            // Verify the insert payload has the correct initial state
            expect(capturedInsertPayload).not.toBeNull();
            expect(capturedInsertPayload!.current_status).toBe('PENDING');
            expect(capturedInsertPayload!.current_leg).toBe('DOMESTIC');
            expect(capturedInsertPayload!.version).toBe(1);
            expect(capturedInsertPayload!.alert_sent).toBe(false);
            // domestic_awb should not be set at insert time (null by default)
            expect(capturedInsertPayload!.domestic_awb).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
