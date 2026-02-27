import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentRow } from '../types';

// Feature: booking-lifecycle-integration, Property 10: Cost fields round-trip through booking service

/**
 * Property 10: Cost fields round-trip through booking service
 *
 * For any valid BookingRequest that includes shippingCost, gstAmount, and totalAmount,
 * the shipment row returned by createBooking SHALL contain those same values in the
 * corresponding columns.
 *
 * **Validates: Requirements 9.2**
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
                data: null, // No existing shipment — always fresh booking
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
    awb: 'AWB-MOCK-COST-TEST',
  }),
}));

// ── State machine mock ──────────────────────────────────────────────────────
// Returns the inserted row with status updated to BOOKING_CONFIRMED.
// We dynamically build the returned shipment to include cost fields from the insert.

vi.mock('../stateMachine', () => ({
  updateShipmentStatus: vi.fn(async ({ shipmentId }: { shipmentId: string }) => {
    // Build a shipment that mirrors what the insert produced, plus the status transition
    return {
      success: true,
      shipment: {
        id: shipmentId,
        current_status: 'BOOKING_CONFIRMED',
        current_leg: 'DOMESTIC',
        version: 2,
        // Cost fields from the captured insert payload
        ...(capturedInsertPayload?.shipping_cost !== undefined && {
          shipping_cost: capturedInsertPayload.shipping_cost,
        }),
        ...(capturedInsertPayload?.gst_amount !== undefined && {
          gst_amount: capturedInsertPayload.gst_amount,
        }),
        ...(capturedInsertPayload?.total_amount !== undefined && {
          total_amount: capturedInsertPayload.total_amount,
        }),
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

const nonNegativeCost = fc.double({
  min: 0,
  max: 999999,
  noNaN: true,
  noDefaultInfinity: true,
});

const userIdArb = fc.uuid();

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 10: Cost fields round-trip through booking service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedInsertPayload = null;
  });

  it('cost fields provided to createBooking appear in the insert payload with matching values', async () => {
    const { createBooking } = await import('../bookingService');

    await fc.assert(
      fc.asyncProperty(
        validBookingArb,
        userIdArb,
        nonNegativeCost,
        nonNegativeCost,
        nonNegativeCost,
        async (booking, userId, shippingCost, gstAmount, totalAmount) => {
          capturedInsertPayload = null;

          const result = await createBooking({
            userId,
            ...booking,
            shippingCost,
            gstAmount,
            totalAmount,
          });

          expect(result.success).toBe(true);

          // Verify the insert payload contains the cost fields with exact values
          expect(capturedInsertPayload).not.toBeNull();
          expect(capturedInsertPayload!.shipping_cost).toBe(shippingCost);
          expect(capturedInsertPayload!.gst_amount).toBe(gstAmount);
          expect(capturedInsertPayload!.total_amount).toBe(totalAmount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returned shipment row contains the cost fields from the insert', async () => {
    const { createBooking } = await import('../bookingService');

    await fc.assert(
      fc.asyncProperty(
        validBookingArb,
        userIdArb,
        nonNegativeCost,
        nonNegativeCost,
        nonNegativeCost,
        async (booking, userId, shippingCost, gstAmount, totalAmount) => {
          capturedInsertPayload = null;

          const result = await createBooking({
            userId,
            ...booking,
            shippingCost,
            gstAmount,
            totalAmount,
          });

          expect(result.success).toBe(true);
          expect(result.shipment).toBeDefined();

          // The shipment returned by the state machine should carry cost fields
          const shipment = result.shipment as unknown as Record<string, unknown>;
          expect(shipment.shipping_cost).toBe(shippingCost);
          expect(shipment.gst_amount).toBe(gstAmount);
          expect(shipment.total_amount).toBe(totalAmount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
