import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateBookingReferenceId } from '../bookingAdapter';

// Feature: booking-lifecycle-integration, Property 3: Booking reference IDs are unique without a draft

/**
 * Property 3: Booking reference IDs are unique without a draft
 *
 * For any N calls to generateBookingReferenceId() with no draftId argument,
 * all returned IDs SHALL be distinct.
 *
 * **Validates: Requirements 1.4**
 */

describe('Property 3: Booking reference IDs are unique without a draft', () => {
  it('generates distinct IDs across multiple calls without draftId', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (count) => {
          const ids = Array.from({ length: count }, () => generateBookingReferenceId());
          const unique = new Set(ids);
          expect(unique.size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all generated IDs start with "booking-" prefix', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (count) => {
          const ids = Array.from({ length: count }, () => generateBookingReferenceId());
          for (const id of ids) {
            expect(id).toMatch(/^booking-/);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('IDs without draft differ from IDs with draft', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40, unit: 'grapheme' }).map((s) => s.replace(/[^\w-]/g, 'x') || 'fallback'),
        (draftId) => {
          const withoutDraft = generateBookingReferenceId();
          const withDraft = generateBookingReferenceId(draftId);
          expect(withoutDraft).not.toBe(withDraft);
        },
      ),
      { numRuns: 100 },
    );
  });
});
