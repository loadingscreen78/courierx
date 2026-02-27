import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  bookingRequestSchema,
  adminActionSchema,
  dispatchSchema,
  cronAuthSchema,
} from '../inputValidator';

/**
 * Property 7: Zod validation rejects invalid inputs
 *
 * For any booking request where at least one field is invalid (negative weight,
 * weight > 30kg, empty address, address > 500 chars, malformed phone, negative
 * dimensions, missing bookingReferenceId), validation should fail.
 * For any admin action with invalid action type or non-UUID shipmentId, validation
 * should fail. For any dispatch with non-UUID shipmentId, validation should fail.
 *
 * Validates: Requirements 1.1, 13.1, 13.2, 13.3, 13.4
 */

// --- Helpers ---

/** Generates a valid booking request object for use as a base. */
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

const validUuid = fc.uuid();

describe('Property 7: Zod validation rejects invalid inputs', () => {

  // ---- bookingRequestSchema ----

  describe('bookingRequestSchema', () => {
    it('accepts valid booking requests', () => {
      fc.assert(
        fc.property(validBookingArb, (req) => {
          const result = bookingRequestSchema.safeParse(req);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('rejects negative weight', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.double({ min: -1000, max: -0.001, noNaN: true, noDefaultInfinity: true }),
          (base, badWeight) => {
            const result = bookingRequestSchema.safeParse({ ...base, weightKg: badWeight });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects zero weight', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const result = bookingRequestSchema.safeParse({ ...base, weightKg: 0 });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('rejects weight exceeding 30kg', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.double({ min: 30.001, max: 10000, noNaN: true, noDefaultInfinity: true }),
          (base, badWeight) => {
            const result = bookingRequestSchema.safeParse({ ...base, weightKg: badWeight });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects empty bookingReferenceId', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const result = bookingRequestSchema.safeParse({ ...base, bookingReferenceId: '' });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('rejects empty originAddress', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const result = bookingRequestSchema.safeParse({ ...base, originAddress: '' });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('rejects empty destinationAddress', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const result = bookingRequestSchema.safeParse({ ...base, destinationAddress: '' });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it('rejects originAddress exceeding 500 chars', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const longAddr = 'a'.repeat(501);
          const result = bookingRequestSchema.safeParse({ ...base, originAddress: longAddr });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 },
      );
    });

    it('rejects destinationAddress exceeding 500 chars', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const longAddr = 'a'.repeat(501);
          const result = bookingRequestSchema.safeParse({ ...base, destinationAddress: longAddr });
          expect(result.success).toBe(false);
        }),
        { numRuns: 50 },
      );
    });

    it('rejects malformed phone numbers', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.constantFrom('abc', '123', '+0123456789', '', '++1234567890', 'not-a-phone'),
          (base, badPhone) => {
            const result = bookingRequestSchema.safeParse({ ...base, recipientPhone: badPhone });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects negative declaredValue', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.double({ min: -10000, max: -0.001, noNaN: true, noDefaultInfinity: true }),
          (base, badValue) => {
            const result = bookingRequestSchema.safeParse({ ...base, declaredValue: badValue });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects invalid shipmentType', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.string().filter((s) => !['medicine', 'document', 'gift'].includes(s)),
          (base, badType) => {
            const result = bookingRequestSchema.safeParse({ ...base, shipmentType: badType });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects negative dimensions', () => {
      fc.assert(
        fc.property(
          validBookingArb,
          fc.double({ min: -1000, max: -0.001, noNaN: true, noDefaultInfinity: true }),
          (base, negDim) => {
            const withDims = {
              ...base,
              dimensions: { lengthCm: negDim, widthCm: 10, heightCm: 10 },
            };
            const result = bookingRequestSchema.safeParse(withDims);
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects destinationCountry shorter than 2 chars', () => {
      fc.assert(
        fc.property(validBookingArb, (base) => {
          const result = bookingRequestSchema.safeParse({ ...base, destinationCountry: 'A' });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ---- adminActionSchema ----

  describe('adminActionSchema', () => {
    it('accepts valid admin actions', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.constantFrom('quality_check' as const, 'package' as const, 'approve_dispatch' as const),
          fc.integer({ min: 1, max: 10000 }),
          (id, action, version) => {
            const result = adminActionSchema.safeParse({
              shipmentId: id,
              action,
              expectedVersion: version,
            });
            expect(result.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects non-UUID shipmentId', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)),
          fc.constantFrom('quality_check' as const, 'package' as const, 'approve_dispatch' as const),
          fc.integer({ min: 1, max: 10000 }),
          (badId, action, version) => {
            const result = adminActionSchema.safeParse({
              shipmentId: badId,
              action,
              expectedVersion: version,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects invalid action types', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.string().filter((s) => !['quality_check', 'package', 'approve_dispatch'].includes(s)),
          fc.integer({ min: 1, max: 10000 }),
          (id, badAction, version) => {
            const result = adminActionSchema.safeParse({
              shipmentId: id,
              action: badAction,
              expectedVersion: version,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects non-positive expectedVersion', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.constantFrom('quality_check' as const, 'package' as const, 'approve_dispatch' as const),
          fc.integer({ min: -10000, max: 0 }),
          (id, action, badVersion) => {
            const result = adminActionSchema.safeParse({
              shipmentId: id,
              action,
              expectedVersion: badVersion,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects non-integer expectedVersion', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.constantFrom('quality_check' as const, 'package' as const, 'approve_dispatch' as const),
          fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }).filter((n) => !Number.isInteger(n)),
          (id, action, floatVersion) => {
            const result = adminActionSchema.safeParse({
              shipmentId: id,
              action,
              expectedVersion: floatVersion,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ---- dispatchSchema ----

  describe('dispatchSchema', () => {
    it('accepts valid dispatch requests', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.integer({ min: 1, max: 10000 }),
          (id, version) => {
            const result = dispatchSchema.safeParse({
              shipmentId: id,
              expectedVersion: version,
            });
            expect(result.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects non-UUID shipmentId', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)),
          fc.integer({ min: 1, max: 10000 }),
          (badId, version) => {
            const result = dispatchSchema.safeParse({
              shipmentId: badId,
              expectedVersion: version,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects non-positive expectedVersion', () => {
      fc.assert(
        fc.property(
          validUuid,
          fc.integer({ min: -10000, max: 0 }),
          (id, badVersion) => {
            const result = dispatchSchema.safeParse({
              shipmentId: id,
              expectedVersion: badVersion,
            });
            expect(result.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ---- cronAuthSchema ----

  describe('cronAuthSchema', () => {
    it('accepts non-empty authorization strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (auth) => {
            const result = cronAuthSchema.safeParse({ authorization: auth });
            expect(result.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects empty authorization string', () => {
      const result = cronAuthSchema.safeParse({ authorization: '' });
      expect(result.success).toBe(false);
    });
  });
});
