import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  filterActiveShipments,
  filterDeliveredShipments,
  filterCancelledShipments,
  type ShipmentLike,
} from './shipmentFilters';

/**
 * Feature: dashboard-realtime-fix, Property 1: Shipment status filtering is correct
 *
 * For any list of shipments with arbitrary statuses, filtering for "active"
 * shipments returns exactly those not in ["delivered","cancelled"], filtering
 * for "delivered" returns exactly those with status "delivered", and
 * active + delivered + cancelled = total.
 *
 * **Validates: Requirements 2.1, 2.3, 3.1, 6.2**
 */

const STATUSES = [
  'pending',
  'confirmed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'on_hold',
  'returned',
];

const arbShipment: fc.Arbitrary<ShipmentLike> = fc.record({
  status: fc.oneof(...STATUSES.map((s) => fc.constant(s))),
});

const arbShipments = fc.array(arbShipment, { minLength: 0, maxLength: 200 });

describe('Feature: dashboard-realtime-fix, Property 1: Shipment status filtering', () => {
  it('active shipments are exactly those not delivered or cancelled', () => {
    fc.assert(
      fc.property(arbShipments, (shipments) => {
        const active = filterActiveShipments(shipments);
        expect(active.every((s) => s.status !== 'delivered' && s.status !== 'cancelled')).toBe(true);
        expect(active.length).toBe(
          shipments.filter((s) => !['delivered', 'cancelled'].includes(s.status)).length
        );
      }),
      { numRuns: 100 }
    );
  });

  it('delivered shipments are exactly those with status "delivered"', () => {
    fc.assert(
      fc.property(arbShipments, (shipments) => {
        const delivered = filterDeliveredShipments(shipments);
        expect(delivered.every((s) => s.status === 'delivered')).toBe(true);
        expect(delivered.length).toBe(
          shipments.filter((s) => s.status === 'delivered').length
        );
      }),
      { numRuns: 100 }
    );
  });

  it('active + delivered + cancelled = total', () => {
    fc.assert(
      fc.property(arbShipments, (shipments) => {
        const active = filterActiveShipments(shipments);
        const delivered = filterDeliveredShipments(shipments);
        const cancelled = filterCancelledShipments(shipments);
        expect(active.length + delivered.length + cancelled.length).toBe(shipments.length);
      }),
      { numRuns: 100 }
    );
  });
});
