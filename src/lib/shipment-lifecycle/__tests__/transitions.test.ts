import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ALLOWED_TRANSITIONS } from '../transitions';
import type { ShipmentLeg, ShipmentStatus } from '../types';

/**
 * Property 17: Allowed transitions map contains no backward transitions.
 *
 * Within each leg the statuses have a canonical forward order.
 * Every (fromStatus → toStatus) pair in ALLOWED_TRANSITIONS must satisfy
 * index(toStatus) > index(fromStatus) — i.e. strictly forward.
 *
 * FAILED is a terminal sink reachable only from PENDING, so it sits at the end
 * of the DOMESTIC ordering but is still "forward" from PENDING.
 *
 * Validates: Requirement 16.3
 */

// Canonical forward ordering of statuses within each leg.
const LEG_STATUS_ORDER: Record<ShipmentLeg, ShipmentStatus[]> = {
  DOMESTIC: [
    'PENDING',
    'BOOKING_CONFIRMED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
  ],
  COUNTER: [
    'ARRIVED_AT_WAREHOUSE',
    'QUALITY_CHECKED',
    'PACKAGED',
    'DISPATCH_APPROVED',
  ],
  INTERNATIONAL: [
    'DISPATCHED',
    'IN_INTERNATIONAL_TRANSIT',
    'CUSTOMS_CLEARANCE',
    'INTL_OUT_FOR_DELIVERY',
    'INTL_DELIVERED',
  ],
  COMPLETED: [],
};

// Collect every (leg, fromStatus, toStatus) triple from the map.
const allTransitions: { leg: ShipmentLeg; from: ShipmentStatus; to: ShipmentStatus }[] = [];

for (const [leg, statusMap] of Object.entries(ALLOWED_TRANSITIONS) as [ShipmentLeg, Partial<Record<ShipmentStatus, ShipmentStatus[]>>][]) {
  for (const [from, targets] of Object.entries(statusMap) as [ShipmentStatus, ShipmentStatus[]][]) {
    for (const to of targets) {
      allTransitions.push({ leg, from, to });
    }
  }
}

describe('Property 17: No backward transitions in allowed transitions map', () => {
  it('should have at least one transition to test', () => {
    expect(allTransitions.length).toBeGreaterThan(0);
  });

  it('every allowed transition moves strictly forward in the leg ordering', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allTransitions),
        ({ leg, from, to }) => {
          const order = LEG_STATUS_ORDER[leg];
          const fromIdx = order.indexOf(from);
          const toIdx = order.indexOf(to);

          // Both statuses must exist in the leg's ordering
          expect(fromIdx).toBeGreaterThanOrEqual(0);
          expect(toIdx).toBeGreaterThanOrEqual(0);

          // Target must be strictly after source — no backward, no self
          expect(toIdx).toBeGreaterThan(fromIdx);
        },
      ),
      { numRuns: allTransitions.length * 10 },
    );
  });

  it('COMPLETED leg has zero allowed transitions', () => {
    const completedTransitions = ALLOWED_TRANSITIONS.COMPLETED;
    expect(Object.keys(completedTransitions)).toHaveLength(0);
  });
});
