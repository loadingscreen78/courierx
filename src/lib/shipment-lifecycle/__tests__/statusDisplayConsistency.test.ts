import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentStatus } from '../types';
import { getStatusLabel, getStatusDotColor, STATUS_LABEL_MAP } from '../statusLabelMap';

/**
 * **Property 3: Status Display Consistency**
 *
 * For any `ShipmentStatus` value, assert that `getStatusLabel(status)` returns
 * the same string regardless of which view calls it (CXBCShipments vs Admin
 * AllShipments both use `STATUS_LABEL_MAP`).
 *
 * This verifies that the label mapping is deterministic: the same status input
 * always produces the same label output, and every valid status has a
 * human-readable label defined in the map.
 *
 * **Validates: Requirements 12.2**
 */

// ── Generators ──────────────────────────────────────────────────────────────

const ALL_SHIPMENT_STATUSES: ShipmentStatus[] = [
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

const shipmentStatusArb = fc.constantFrom(...ALL_SHIPMENT_STATUSES);

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 3: Status Display Consistency', () => {

  it('getStatusLabel returns the same string for the same status across repeated calls', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        // Simulate two independent view calls (CXBCShipments and Admin AllShipments)
        const labelFromCXBC = getStatusLabel(status);
        const labelFromAdmin = getStatusLabel(status);

        expect(labelFromCXBC).toBe(labelFromAdmin);
      }),
      { numRuns: 200 },
    );
  });

  it('getStatusLabel always returns a non-empty human-readable string for every valid status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const label = getStatusLabel(status);

        // Must be a non-empty string
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);

        // Must not be the raw enum value (i.e., it was mapped to a human-readable label)
        expect(label).not.toBe(status);
      }),
      { numRuns: 200 },
    );
  });

  it('getStatusLabel output matches STATUS_LABEL_MAP directly for every status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const fromFunction = getStatusLabel(status);
        const fromMap = STATUS_LABEL_MAP[status].label;

        // Both access paths must yield the identical label
        expect(fromFunction).toBe(fromMap);
      }),
      { numRuns: 200 },
    );
  });

  it('getStatusDotColor is also deterministic for every status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const color1 = getStatusDotColor(status);
        const color2 = getStatusDotColor(status);

        expect(color1).toBe(color2);
        // Must be a valid Tailwind bg-* class
        expect(color1).toMatch(/^bg-\w+-\d+$/);
      }),
      { numRuns: 200 },
    );
  });

  it('every ShipmentStatus has a complete display entry in STATUS_LABEL_MAP', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const entry = STATUS_LABEL_MAP[status];

        expect(entry).toBeDefined();
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
        expect(typeof entry.dotColor).toBe('string');
        expect(entry.dotColor.length).toBeGreaterThan(0);
        expect(typeof entry.badgeVariant).toBe('string');
        expect(entry.badgeVariant.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });
});
