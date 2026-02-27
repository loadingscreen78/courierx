import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatAddress } from '../bookingAdapter';

// Feature: booking-lifecycle-integration, Property 2: Address formatting preserves all non-empty components

/**
 * Property 2: Address formatting preserves all non-empty components
 *
 * For any address object (pickup or consignee) where addressLine1, city, and
 * the postal code are non-empty, the output of formatAddress SHALL contain
 * each of those non-empty field values as substrings.
 *
 * **Validates: Requirements 1.5, 1.6**
 */

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Non-empty string that avoids characters that could interfere with format delimiters. */
const safeNonEmptyStr = fc
  .string({ minLength: 1, maxLength: 60, unit: 'grapheme' })
  .map((s) => s.replace(/[^\w ]/g, 'a') || 'Fallback');

/** Possibly-empty string (for addressLine2 which is optional). */
const safeOptionalStr = fc
  .string({ maxLength: 60, unit: 'grapheme' })
  .map((s) => s.replace(/[^\w ]/g, ''));

const pickupAddressArb = fc.record({
  fullName: safeNonEmptyStr,
  phone: fc.constantFrom('+919876543210', '+14155551234'),
  addressLine1: safeNonEmptyStr,
  addressLine2: safeOptionalStr,
  city: safeNonEmptyStr,
  state: safeNonEmptyStr,
  pincode: fc.stringMatching(/^[1-9]\d{5}$/),
});

const consigneeAddressArb = fc.record({
  fullName: safeNonEmptyStr,
  phone: fc.constantFrom('+919876543210', '+14155551234'),
  email: fc.constantFrom('test@example.com', ''),
  addressLine1: safeNonEmptyStr,
  addressLine2: safeOptionalStr,
  city: safeNonEmptyStr,
  country: fc.constantFrom('United States', 'United Kingdom', 'Canada', 'UAE', 'India'),
  zipcode: fc.stringMatching(/^[1-9]\d{4,5}$/),
});

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 2: Address formatting preserves all non-empty components', () => {
  it('pickup address: addressLine1, city, state, and pincode appear in output', () => {
    fc.assert(
      fc.property(pickupAddressArb, (addr) => {
        const result = formatAddress(addr);

        expect(result).toContain(addr.addressLine1);
        expect(result).toContain(addr.city);
        expect(result).toContain(addr.state);
        expect(result).toContain(addr.pincode);
      }),
      { numRuns: 100 },
    );
  });

  it('consignee address: addressLine1, city, country, and zipcode appear in output', () => {
    fc.assert(
      fc.property(consigneeAddressArb, (addr) => {
        const result = formatAddress(addr);

        expect(result).toContain(addr.addressLine1);
        expect(result).toContain(addr.city);
        expect(result).toContain(addr.country);
        expect(result).toContain(addr.zipcode);
      }),
      { numRuns: 100 },
    );
  });

  it('non-empty addressLine2 appears in output for pickup addresses', () => {
    const withLine2 = pickupAddressArb.filter((a) => a.addressLine2.length > 0);

    fc.assert(
      fc.property(withLine2, (addr) => {
        const result = formatAddress(addr);
        expect(result).toContain(addr.addressLine2);
      }),
      { numRuns: 100 },
    );
  });

  it('non-empty addressLine2 appears in output for consignee addresses', () => {
    const withLine2 = consigneeAddressArb.filter((a) => a.addressLine2.length > 0);

    fc.assert(
      fc.property(withLine2, (addr) => {
        const result = formatAddress(addr);
        expect(result).toContain(addr.addressLine2);
      }),
      { numRuns: 100 },
    );
  });

  it('empty addressLine2 does not produce double commas', () => {
    const withoutLine2 = pickupAddressArb.map((a) => ({ ...a, addressLine2: '' }));

    fc.assert(
      fc.property(withoutLine2, (addr) => {
        const result = formatAddress(addr);
        // When line2 is empty the format should be "{line1}, {city}, ..." with no ",, "
        expect(result).not.toContain(', , ');
      }),
      { numRuns: 100 },
    );
  });
});
