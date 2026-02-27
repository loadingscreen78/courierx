import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateBookingReferenceId } from '../bookingAdapter';

// Feature: booking-lifecycle-integration, Property 7: Deterministic booking reference from draft ID

/**
 * Property 7: Deterministic booking reference from draft ID
 *
 * For any non-empty draftId string, calling generateBookingReferenceId(draftId)
 * multiple times SHALL always return the same value.
 *
 * **Validates: Requirements 7.1**
 */

describe('Property 7: Deterministic booking reference from draft ID', () => {

  it('returns the same reference ID for the same draftId across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }),
        (draftId) => {
          const first = generateBookingReferenceId(draftId);
          const second = generateBookingReferenceId(draftId);
          expect(first).toBe(second);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns the same reference ID for UUID-style draftIds', () => {
    fc.assert(
      fc.property(fc.uuid(), (draftId) => {
        const first = generateBookingReferenceId(draftId);
        const second = generateBookingReferenceId(draftId);
        const third = generateBookingReferenceId(draftId);
        expect(first).toBe(second);
        expect(second).toBe(third);
      }),
      { numRuns: 100 },
    );
  });

  it('produces the expected draft- prefix format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100, unit: 'grapheme' }),
        (draftId) => {
          const result = generateBookingReferenceId(draftId);
          expect(result).toBe(`draft-${draftId}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});
