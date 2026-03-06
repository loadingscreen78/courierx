import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: Booking Round-Trip
 *
 * For any valid booking payload, the shipment record returned by the API
 * contains identical `recipient_name`, `destination_country`, `weight_kg`,
 * `declared_value`, `shipment_type` as submitted.
 *
 * **Validates: Requirements 12.1**
 */

// ── Mock state ──────────────────────────────────────────────────────────────

let capturedInsertPayload: Record<string, unknown> | null = null;

// ── Supabase mock ───────────────────────────────────────────────────────────

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'not found' },
              }),
            })),
          })),
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
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: row,
                  error: null,
                }),
              })),
            };
          }),
          update: vi.fn(() => {
            const eqFn = vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                })),
              })),
            }));
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
    awb: 'AWB-MOCK-ROUNDTRIP',
  }),
}));

// ── State machine mock ──────────────────────────────────────────────────────
// Returns the inserted row with status updated to BOOKING_CONFIRMED,
// carrying through the round-trip fields from the captured insert payload.

vi.mock('../stateMachine', () => ({
  updateShipmentStatus: vi.fn(async ({ shipmentId }: { shipmentId: string }) => {
    return {
      success: true,
      shipment: {
        id: shipmentId,
        current_status: 'BOOKING_CONFIRMED',
        current_leg: 'DOMESTIC',
        version: 2,
        recipient_name: capturedInsertPayload?.recipient_name,
        destination_country: capturedInsertPayload?.destination_country,
        weight_kg: capturedInsertPayload?.weight_kg,
        declared_value: capturedInsertPayload?.declared_value,
        shipment_type: capturedInsertPayload?.shipment_type,
      },
    };
  }),
}));

// ── Arbitraries ─────────────────────────────────────────────────────────────

const validBookingArb = fc.record({
  bookingReferenceId: fc
    .string({ minLength: 1, maxLength: 64, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w-]/g, 'a') || 'a'),
  recipientName: fc
    .string({ minLength: 1, maxLength: 50, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  recipientPhone: fc.constantFrom(
    '+14155551234',
    '+919876543210',
    '+442071234567',
    '14155551234',
  ),
  originAddress: fc
    .string({ minLength: 1, maxLength: 100, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationAddress: fc
    .string({ minLength: 1, maxLength: 100, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationCountry: fc
    .string({ minLength: 2, maxLength: 50, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w]/g, 'ab').slice(0, 50) || 'ab'),
  weightKg: fc.double({ min: 0.01, max: 30, noNaN: true, noDefaultInfinity: true }),
  declaredValue: fc.double({ min: 0.01, max: 999999, noNaN: true, noDefaultInfinity: true }),
  shipmentType: fc.constantFrom('medicine' as const, 'document' as const, 'gift' as const),
});

const userIdArb = fc.uuid();

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 2: Booking Round-Trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedInsertPayload = null;
  });

  it('insert payload contains identical recipient_name, destination_country, weight_kg, declared_value, shipment_type as submitted', async () => {
    const { createBooking } = await import('../bookingService');

    await fc.assert(
      fc.asyncProperty(
        validBookingArb,
        userIdArb,
        async (booking, userId) => {
          capturedInsertPayload = null;

          const result = await createBooking({
            userId,
            ...booking,
          });

          expect(result.success).toBe(true);
          expect(capturedInsertPayload).not.toBeNull();

          // Round-trip: insert payload fields match submitted values exactly
          expect(capturedInsertPayload!.recipient_name).toBe(booking.recipientName);
          expect(capturedInsertPayload!.destination_country).toBe(booking.destinationCountry);
          expect(capturedInsertPayload!.weight_kg).toBe(booking.weightKg);
          expect(capturedInsertPayload!.declared_value).toBe(booking.declaredValue);
          expect(capturedInsertPayload!.shipment_type).toBe(booking.shipmentType);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returned shipment record contains identical round-trip fields as submitted', async () => {
    const { createBooking } = await import('../bookingService');

    await fc.assert(
      fc.asyncProperty(
        validBookingArb,
        userIdArb,
        async (booking, userId) => {
          capturedInsertPayload = null;

          const result = await createBooking({
            userId,
            ...booking,
          });

          expect(result.success).toBe(true);
          expect(result.shipment).toBeDefined();

          const shipment = result.shipment as unknown as Record<string, unknown>;
          expect(shipment.recipient_name).toBe(booking.recipientName);
          expect(shipment.destination_country).toBe(booking.destinationCountry);
          expect(shipment.weight_kg).toBe(booking.weightKg);
          expect(shipment.declared_value).toBe(booking.declaredValue);
          expect(shipment.shipment_type).toBe(booking.shipmentType);
        },
      ),
      { numRuns: 100 },
    );
  });
});
