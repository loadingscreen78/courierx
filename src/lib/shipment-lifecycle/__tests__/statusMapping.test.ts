import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NIMBUS_STATUS_MAP, mapNimbusStatus } from '../statusMapping';
import type { ShipmentStatus } from '../types';

/**
 * Property 8: Status mapping correctness
 *
 * For any known Nimbus status key, mapNimbusStatus returns the correct
 * non-null ShipmentStatus. For any string NOT in the map, it returns null.
 * The mapping is deterministic and all mapped values are valid ShipmentStatus values.
 *
 * Validates: Requirements 2.2
 */

const ALL_VALID_STATUSES: ShipmentStatus[] = [
  'PENDING',
  'BOOKING_CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'ARRIVED_AT_WAREHOUSE',
  'QUALITY_CHECKED',
  'PACKAGED',
  'DISPATCH_APPROVED',
  'DISPATCHED',
  'IN_INTERNATIONAL_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'INTL_OUT_FOR_DELIVERY',
  'INTL_DELIVERED',
  'FAILED',
];

const knownKeys = Object.keys(NIMBUS_STATUS_MAP);

describe('Property 8: Status mapping correctness', () => {
  it('should have at least one known mapping to test', () => {
    expect(knownKeys.length).toBeGreaterThan(0);
  });

  it('known Nimbus status keys return a non-null valid ShipmentStatus', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...knownKeys),
        (rawStatus) => {
          const result = mapNimbusStatus(rawStatus);

          // Must be non-null
          expect(result).not.toBeNull();

          // Must match the expected mapping
          expect(result).toBe(NIMBUS_STATUS_MAP[rawStatus]);

          // Must be a valid ShipmentStatus
          expect(ALL_VALID_STATUSES).toContain(result);
        },
      ),
      { numRuns: knownKeys.length * 25 },
    );
  });

  it('unknown status strings return null', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !knownKeys.includes(s)),
        (rawStatus) => {
          const result = mapNimbusStatus(rawStatus);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 200 },
    );
  });

  it('mapping is deterministic — same input always yields same output', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (rawStatus) => {
          const first = mapNimbusStatus(rawStatus);
          const second = mapNimbusStatus(rawStatus);
          expect(first).toBe(second);
        },
      ),
      { numRuns: 200 },
    );
  });
});
