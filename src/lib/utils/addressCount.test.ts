import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { countAddresses, type AddressLike } from './addressCount';

/**
 * Feature: dashboard-realtime-fix, Property 3: Address count matches stored addresses
 *
 * For any set of addresses stored for a user, the displayed "Saved Addresses"
 * count should equal the length of the addresses array returned by the query.
 *
 * **Validates: Requirements 2.4**
 */

const ADDRESS_TYPES = ['pickup', 'delivery'] as const;
const ADDRESS_LABELS = ['home', 'office', 'other'] as const;

const arbAddress: fc.Arbitrary<AddressLike> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  type: fc.constantFrom(...ADDRESS_TYPES),
  label: fc.constantFrom(...ADDRESS_LABELS),
});

const arbAddresses = fc.array(arbAddress, { minLength: 0, maxLength: 200 });

describe('Feature: dashboard-realtime-fix, Property 3: Address count matches stored addresses', () => {
  it('count equals the array length for any set of addresses', () => {
    fc.assert(
      fc.property(arbAddresses, (addresses) => {
        const count = countAddresses(addresses);
        expect(count).toBe(addresses.length);
      }),
      { numRuns: 100 }
    );
  });

  it('count is zero for an empty address array', () => {
    fc.assert(
      fc.property(fc.constant([] as AddressLike[]), (addresses) => {
        expect(countAddresses(addresses)).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('count is always non-negative', () => {
    fc.assert(
      fc.property(arbAddresses, (addresses) => {
        expect(countAddresses(addresses)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
