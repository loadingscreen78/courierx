import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { bookingRequestSchema } from '../inputValidator';

// Feature: booking-lifecycle-integration, Property 9: Extended schema accepts optional cost fields

/**
 * Property 9: Extended schema accepts optional cost fields
 *
 * For any valid base BookingRequestSchema payload, adding shippingCost, gstAmount,
 * and totalAmount as non-negative numbers SHALL still pass schema validation.
 * Omitting all three SHALL also pass validation.
 *
 * **Validates: Requirements 9.1**
 */

const validBookingArb = fc.record({
  bookingReferenceId: fc.string({ minLength: 1, maxLength: 64, unit: 'grapheme' }).map(s => s.replace(/[^\w-]/g, 'a') || 'a'),
  recipientName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  recipientPhone: fc.constantFrom('+14155551234', '+919876543210', '+442071234567', '14155551234'),
  recipientEmail: fc.constant(undefined),
  originAddress: fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationAddress: fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationCountry: fc.string({ minLength: 2, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w]/g, 'ab').slice(0, 50) || 'ab'),
  weightKg: fc.double({ min: 0.01, max: 30, noNaN: true, noDefaultInfinity: true }),
  declaredValue: fc.double({ min: 0.01, max: 999999, noNaN: true, noDefaultInfinity: true }),
  shipmentType: fc.constantFrom('medicine' as const, 'document' as const, 'gift' as const),
});

const nonNegativeCost = fc.double({ min: 0, max: 999999, noNaN: true, noDefaultInfinity: true });

describe('Property 9: Extended schema accepts optional cost fields', () => {

  it('accepts valid payloads WITHOUT any cost fields', () => {
    fc.assert(
      fc.property(validBookingArb, (base) => {
        const result = bookingRequestSchema.safeParse(base);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('accepts valid payloads WITH all three cost fields', () => {
    fc.assert(
      fc.property(
        validBookingArb,
        nonNegativeCost,
        nonNegativeCost,
        nonNegativeCost,
        (base, shippingCost, gstAmount, totalAmount) => {
          const result = bookingRequestSchema.safeParse({
            ...base,
            shippingCost,
            gstAmount,
            totalAmount,
          });
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('accepts valid payloads with any subset of cost fields', () => {
    const optionalCost = fc.oneof(nonNegativeCost, fc.constant(undefined));
    fc.assert(
      fc.property(
        validBookingArb,
        optionalCost,
        optionalCost,
        optionalCost,
        (base, shippingCost, gstAmount, totalAmount) => {
          const payload: Record<string, unknown> = { ...base };
          if (shippingCost !== undefined) payload.shippingCost = shippingCost;
          if (gstAmount !== undefined) payload.gstAmount = gstAmount;
          if (totalAmount !== undefined) payload.totalAmount = totalAmount;
          const result = bookingRequestSchema.safeParse(payload);
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects negative cost values', () => {
    const negativeCost = fc.double({ min: -999999, max: -0.001, noNaN: true, noDefaultInfinity: true });
    const costField = fc.constantFrom('shippingCost' as const, 'gstAmount' as const, 'totalAmount' as const);
    fc.assert(
      fc.property(
        validBookingArb,
        negativeCost,
        costField,
        (base, badCost, field) => {
          const result = bookingRequestSchema.safeParse({ ...base, [field]: badCost });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects non-number cost values', () => {
    const nonNumber = fc.constantFrom('100', true, null, {}, [1]);
    const costField = fc.constantFrom('shippingCost' as const, 'gstAmount' as const, 'totalAmount' as const);
    fc.assert(
      fc.property(
        validBookingArb,
        nonNumber,
        costField,
        (base, badValue, field) => {
          const result = bookingRequestSchema.safeParse({ ...base, [field]: badValue });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
