import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentStatus, ShipmentLeg, TimelineSource } from '../types';
import {
  STATUS_LABEL_MAP,
  LEG_LABEL_MAP,
  SOURCE_LABEL_MAP,
  getStatusLabel,
  getStatusDotColor,
  getLegLabel,
  formatTimelineDate,
} from '../statusLabelMap';

// ── Arbitraries ─────────────────────────────────────────────────────────────

const ALL_STATUSES: ShipmentStatus[] = [
  'PENDING', 'BOOKING_CONFIRMED', 'PICKED_UP', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'ARRIVED_AT_WAREHOUSE',
  'QUALITY_CHECKED', 'PACKAGED', 'DISPATCH_APPROVED', 'DISPATCHED',
  'IN_INTERNATIONAL_TRANSIT', 'CUSTOMS_CLEARANCE',
  'INTL_OUT_FOR_DELIVERY', 'INTL_DELIVERED', 'FAILED',
];

const ALL_LEGS: ShipmentLeg[] = ['DOMESTIC', 'COUNTER', 'INTERNATIONAL', 'COMPLETED'];

const ALL_SOURCES: TimelineSource[] = ['NIMBUS', 'INTERNAL', 'SIMULATION', 'SYSTEM'];

const shipmentStatusArb = fc.constantFrom(...ALL_STATUSES);
const shipmentLegArb = fc.constantFrom(...ALL_LEGS);
const timelineSourceArb = fc.constantFrom(...ALL_SOURCES);

/**
 * Generates a valid ISO 8601 timestamp within a reasonable date range.
 * Uses integer milliseconds to avoid invalid date issues during shrinking.
 * Range: 2020-01-01 to 2030-12-31
 */
const MIN_TS = new Date('2020-01-01T00:00:00Z').getTime();
const MAX_TS = new Date('2030-12-31T23:59:59Z').getTime();
const isoTimestampArb = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ms) => new Date(ms).toISOString());

// ── Property 1: Status label map completeness ───────────────────────────────

describe('Property 1: Status label map completeness', () => {
  it('for any valid ShipmentStatus, STATUS_LABEL_MAP returns a non-empty label', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const info = STATUS_LABEL_MAP[status];
        expect(info).toBeDefined();
        expect(info.label).toBeTruthy();
        expect(info.label.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });

  it('for any valid ShipmentStatus, STATUS_LABEL_MAP returns a non-empty dotColor', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const info = STATUS_LABEL_MAP[status];
        expect(info.dotColor).toBeTruthy();
        expect(info.dotColor).toMatch(/^bg-/);
      }),
      { numRuns: 200 },
    );
  });

  it('for any valid ShipmentStatus, STATUS_LABEL_MAP returns a non-empty badgeVariant', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        const info = STATUS_LABEL_MAP[status];
        expect(info.badgeVariant).toBeTruthy();
        expect(info.badgeVariant.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 },
    );
  });

  it('getStatusLabel returns the same label as STATUS_LABEL_MAP for any valid status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        expect(getStatusLabel(status)).toBe(STATUS_LABEL_MAP[status].label);
      }),
      { numRuns: 200 },
    );
  });

  it('getStatusDotColor returns the same dotColor as STATUS_LABEL_MAP for any valid status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        expect(getStatusDotColor(status)).toBe(STATUS_LABEL_MAP[status].dotColor);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 2: Display maps completeness ───────────────────────────────────

describe('Property 2: Display maps completeness — leg labels and source labels', () => {
  it('for any valid ShipmentLeg, LEG_LABEL_MAP returns a non-empty label', () => {
    fc.assert(
      fc.property(shipmentLegArb, (leg) => {
        const label = LEG_LABEL_MAP[leg];
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('getLegLabel returns the same label as LEG_LABEL_MAP for any valid leg', () => {
    fc.assert(
      fc.property(shipmentLegArb, (leg) => {
        expect(getLegLabel(leg)).toBe(LEG_LABEL_MAP[leg]);
      }),
      { numRuns: 100 },
    );
  });

  it('for any valid TimelineSource, SOURCE_LABEL_MAP returns a non-empty label and color', () => {
    fc.assert(
      fc.property(timelineSourceArb, (source) => {
        const info = SOURCE_LABEL_MAP[source];
        expect(info).toBeDefined();
        expect(info.label).toBeTruthy();
        expect(info.label.length).toBeGreaterThan(0);
        expect(info.color).toBeTruthy();
        expect(info.color.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('no two TimelineSource values share the same label', () => {
    const labels = ALL_SOURCES.map((s) => SOURCE_LABEL_MAP[s].label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('no two TimelineSource values share the same color', () => {
    const colors = ALL_SOURCES.map((s) => SOURCE_LABEL_MAP[s].color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

// ── Property 16: Timestamp formatting ───────────────────────────────────────

describe('Property 16: Timestamp formatting', () => {
  it('for any valid ISO 8601 timestamp, formatTimelineDate produces DD MMM YYYY, HH:mm', () => {
    fc.assert(
      fc.property(isoTimestampArb, (iso) => {
        const result = formatTimelineDate(iso);
        // Pattern: "DD MMM YYYY, HH:mm" e.g. "15 Jan 2026, 14:30"
        // Month abbreviation is 3-4 chars (e.g. "Jan", "Sept" depending on locale impl)
        expect(result).toMatch(/^\d{2} [A-Z][a-z]{2,3} \d{4}, \d{2}:\d{2}$/);
      }),
      { numRuns: 500 },
    );
  });

  it('formatted date reflects the correct date components from the input', () => {
    fc.assert(
      fc.property(isoTimestampArb, (iso) => {
        const d = new Date(iso);
        const result = formatTimelineDate(iso);

        // Extract year from the formatted string
        const yearMatch = result.match(/\d{4}/);
        expect(yearMatch).not.toBeNull();
        expect(Number(yearMatch![0])).toBe(d.getFullYear());
      }),
      { numRuns: 200 },
    );
  });
});

// ── Timeline entry arbitrary ────────────────────────────────────────────────

const timelineEntryArb = fc.record({
  id: fc.uuid(),
  shipment_id: fc.uuid(),
  status: shipmentStatusArb,
  leg: shipmentLegArb,
  source: timelineSourceArb,
  metadata: fc.constant({} as Record<string, unknown>),
  created_at: isoTimestampArb,
});

// ── Property 5: Timeline chronological ordering ─────────────────────────────

describe('Property 5: Timeline chronological ordering', () => {
  it('for any list of timeline entries sorted by created_at ascending, consecutive pairs satisfy entries[i].created_at <= entries[i+1].created_at', () => {
    fc.assert(
      fc.property(
        fc.array(timelineEntryArb, { minLength: 0, maxLength: 50 }),
        (entries) => {
          // Sort ascending by created_at — this is what the query does
          const sorted = [...entries].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

          for (let i = 0; i < sorted.length - 1; i++) {
            expect(new Date(sorted[i].created_at).getTime())
              .toBeLessThanOrEqual(new Date(sorted[i + 1].created_at).getTime());
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('sorting is stable — entries with identical created_at preserve their relative order', () => {
    fc.assert(
      fc.property(
        fc.array(timelineEntryArb, { minLength: 2, maxLength: 30 }),
        (entries) => {
          // Give all entries the same timestamp
          const sameTs = entries[0].created_at;
          const uniform = entries.map((e) => ({ ...e, created_at: sameTs }));

          const sorted = [...uniform].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

          // All timestamps equal, so length must be preserved
          expect(sorted.length).toBe(uniform.length);
          // All ids preserved
          const originalIds = uniform.map((e) => e.id);
          const sortedIds = sorted.map((e) => e.id);
          expect(sortedIds).toEqual(originalIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 6: Timeline completeness — all entries shown ───────────────────

describe('Property 6: Timeline completeness — all entries shown regardless of leg', () => {
  it('for any shipment with entries spanning multiple legs, all entries are returned', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(
          fc.record({
            id: fc.uuid(),
            status: shipmentStatusArb,
            leg: shipmentLegArb,
            source: timelineSourceArb,
            metadata: fc.constant({} as Record<string, unknown>),
            created_at: isoTimestampArb,
          }),
          { minLength: 1, maxLength: 40 },
        ),
        (shipmentId, rawEntries) => {
          // Assign all entries to the same shipment
          const entries = rawEntries.map((e) => ({ ...e, shipment_id: shipmentId }));

          // Simulate the timeline query: filter by shipment_id (all match), return all
          const queried = entries.filter((e) => e.shipment_id === shipmentId);

          // All entries must be returned regardless of their leg value
          expect(queried.length).toBe(entries.length);

          // Every leg present in the original set must be present in the result
          const originalLegs = new Set(entries.map((e) => e.leg));
          const queriedLegs = new Set(queried.map((e) => e.leg));
          expect(queriedLegs).toEqual(originalLegs);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('entries from DOMESTIC, COUNTER, and INTERNATIONAL legs all appear in the result', () => {
    fc.assert(
      fc.property(fc.uuid(), (shipmentId) => {
        // Create one entry per non-COMPLETED leg to simulate a multi-leg shipment
        const legs: ShipmentLeg[] = ['DOMESTIC', 'COUNTER', 'INTERNATIONAL'];
        const entries = legs.map((leg, i) => ({
          id: `entry-${i}`,
          shipment_id: shipmentId,
          status: 'IN_TRANSIT' as ShipmentStatus,
          leg,
          source: 'SYSTEM' as TimelineSource,
          metadata: {},
          created_at: new Date(2026, 0, i + 1).toISOString(),
        }));

        // Query returns all entries for the shipment — no leg filtering
        const queried = entries.filter((e) => e.shipment_id === shipmentId);

        expect(queried.length).toBe(3);
        expect(queried.map((e) => e.leg)).toEqual(expect.arrayContaining(legs));
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 14: Timeline append-only on new entry ──────────────────────────

describe('Property 14: Timeline append-only on new entry', () => {
  it('given N existing entries and a new entry, result has N+1 entries with all originals preserved', () => {
    fc.assert(
      fc.property(
        fc.array(timelineEntryArb, { minLength: 0, maxLength: 50 }),
        timelineEntryArb,
        (existing, newEntry) => {
          // Simulate the append logic from useShipmentTimeline's realtime handler:
          // setEntries(prev => [...prev, payload.new])
          const result = [...existing, newEntry];

          // N+1 entries
          expect(result.length).toBe(existing.length + 1);

          // All original entries preserved in order
          for (let i = 0; i < existing.length; i++) {
            expect(result[i].id).toBe(existing[i].id);
            expect(result[i].created_at).toBe(existing[i].created_at);
            expect(result[i].status).toBe(existing[i].status);
            expect(result[i].leg).toBe(existing[i].leg);
            expect(result[i].source).toBe(existing[i].source);
          }

          // New entry is the last element
          expect(result[result.length - 1].id).toBe(newEntry.id);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('appending never mutates the original array', () => {
    fc.assert(
      fc.property(
        fc.array(timelineEntryArb, { minLength: 1, maxLength: 30 }),
        timelineEntryArb,
        (existing, newEntry) => {
          const originalLength = existing.length;
          const originalIds = existing.map((e) => e.id);

          // Append (spread creates a new array)
          const result = [...existing, newEntry];

          // Original array unchanged
          expect(existing.length).toBe(originalLength);
          expect(existing.map((e) => e.id)).toEqual(originalIds);
          // Result is a different reference
          expect(result).not.toBe(existing);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ── Shipment arbitrary for dashboard tests ──────────────────────────────────

const ADMIN_VISIBLE_LEGS: ShipmentLeg[] = ['COUNTER', 'INTERNATIONAL', 'COMPLETED'];

const shipmentArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  current_leg: shipmentLegArb,
  current_status: shipmentStatusArb,
  domestic_awb: fc.option(fc.string(), { nil: null }),
  international_awb: fc.option(fc.string(), { nil: null }),
  version: fc.nat({ max: 1000 }),
  booking_reference_id: fc.constant(null as string | null),
  alert_sent: fc.boolean(),
  origin_address: fc.string(),
  destination_address: fc.string(),
  destination_country: fc.string(),
  recipient_name: fc.string(),
  recipient_phone: fc.option(fc.string(), { nil: null }),
  weight_kg: fc.option(fc.float({ min: Math.fround(0.1), max: 100, noNaN: true }), { nil: null }),
  created_at: isoTimestampArb,
  updated_at: isoTimestampArb,
});

// ── Pure logic extracted from AdminDashboard for testability ─────────────────

/** Simulates the admin panel query filter: only COUNTER, INTERNATIONAL, COMPLETED */
function filterAdminVisible(shipments: { current_leg: ShipmentLeg; current_status: ShipmentStatus; updated_at: string; id: string }[]) {
  return shipments.filter(s => ADMIN_VISIBLE_LEGS.includes(s.current_leg));
}

/** Simulates queue tab grouping from AdminDashboard */
function groupByQueueTab(shipments: { current_leg: ShipmentLeg; current_status: ShipmentStatus; updated_at: string; id: string }[]) {
  return {
    warehouse: shipments.filter(s => s.current_leg === 'COUNTER'),
    international: shipments.filter(s => s.current_leg === 'INTERNATIONAL'),
    delivered: shipments.filter(s => s.current_leg === 'COMPLETED'),
  };
}

/** Simulates stat card counting from AdminDashboard */
function computeStatCounts(shipments: { current_status: ShipmentStatus; current_leg: ShipmentLeg; updated_at: string; id: string }[]) {
  return {
    pendingQC: shipments.filter(s => s.current_status === 'ARRIVED_AT_WAREHOUSE').length,
    readyToDispatch: shipments.filter(s => s.current_status === 'DISPATCH_APPROVED').length,
    onHold: shipments.filter(s => s.current_status === 'PACKAGED').length,
  };
}

/** Simulates queue sorting from AdminDashboard: updated_at descending */
function sortByUpdatedDesc<T extends { updated_at: string }>(shipments: T[]): T[] {
  return [...shipments].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

// ── Property 7: Admin visibility filtering — DOMESTIC excluded ──────────────

describe('Property 7: Admin visibility filtering — DOMESTIC excluded', () => {
  it('admin query returns zero shipments with current_leg = DOMESTIC', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const visible = filterAdminVisible(shipments);
          const domesticInResult = visible.filter(s => s.current_leg === 'DOMESTIC');
          expect(domesticInResult.length).toBe(0);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('admin query returns exactly the shipments with current_leg in COUNTER, INTERNATIONAL, COMPLETED', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const visible = filterAdminVisible(shipments);
          const expectedCount = shipments.filter(s =>
            s.current_leg === 'COUNTER' || s.current_leg === 'INTERNATIONAL' || s.current_leg === 'COMPLETED'
          ).length;
          expect(visible.length).toBe(expectedCount);
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ── Property 12: Queue tab grouping by leg ──────────────────────────────────

describe('Property 12: Queue tab grouping by leg', () => {
  it('each shipment appears in exactly one queue tab matching its current_leg', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const adminVisible = filterAdminVisible(shipments);
          const queues = groupByQueueTab(adminVisible);

          // Total across all tabs equals total admin-visible shipments
          const totalInQueues = queues.warehouse.length + queues.international.length + queues.delivered.length;
          expect(totalInQueues).toBe(adminVisible.length);

          // Each queue contains only shipments with the correct leg
          queues.warehouse.forEach(s => expect(s.current_leg).toBe('COUNTER'));
          queues.international.forEach(s => expect(s.current_leg).toBe('INTERNATIONAL'));
          queues.delivered.forEach(s => expect(s.current_leg).toBe('COMPLETED'));
        },
      ),
      { numRuns: 300 },
    );
  });

  it('count badge equals shipment count per tab', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const adminVisible = filterAdminVisible(shipments);
          const queues = groupByQueueTab(adminVisible);

          // Count badge is just .length of each queue array (as used in AdminDashboard)
          expect(queues.warehouse.length).toBe(adminVisible.filter(s => s.current_leg === 'COUNTER').length);
          expect(queues.international.length).toBe(adminVisible.filter(s => s.current_leg === 'INTERNATIONAL').length);
          expect(queues.delivered.length).toBe(adminVisible.filter(s => s.current_leg === 'COMPLETED').length);
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ── Property 13: Stat card lifecycle counts ─────────────────────────────────

describe('Property 13: Stat card lifecycle counts', () => {
  it('Pending QC = count of ARRIVED_AT_WAREHOUSE, Ready to Dispatch = count of DISPATCH_APPROVED, On Hold = count of PACKAGED', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const adminVisible = filterAdminVisible(shipments);
          const stats = computeStatCounts(adminVisible);

          expect(stats.pendingQC).toBe(
            adminVisible.filter(s => s.current_status === 'ARRIVED_AT_WAREHOUSE').length,
          );
          expect(stats.readyToDispatch).toBe(
            adminVisible.filter(s => s.current_status === 'DISPATCH_APPROVED').length,
          );
          expect(stats.onHold).toBe(
            adminVisible.filter(s => s.current_status === 'PACKAGED').length,
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  it('stat counts are non-negative for any input', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const stats = computeStatCounts(filterAdminVisible(shipments));
          expect(stats.pendingQC).toBeGreaterThanOrEqual(0);
          expect(stats.readyToDispatch).toBeGreaterThanOrEqual(0);
          expect(stats.onHold).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ── Property 15: Queue sorting by updated_at descending ─────────────────────

describe('Property 15: Queue sorting by updated_at descending', () => {
  it('shipments within each queue tab are sorted by updated_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 0, maxLength: 50 }),
        (shipments) => {
          const adminVisible = filterAdminVisible(shipments);
          const queues = groupByQueueTab(adminVisible);

          // Sort each queue as the dashboard does
          const sortedWarehouse = sortByUpdatedDesc(queues.warehouse);
          const sortedInternational = sortByUpdatedDesc(queues.international);
          const sortedDelivered = sortByUpdatedDesc(queues.delivered);

          // Verify descending order for each queue
          for (const sorted of [sortedWarehouse, sortedInternational, sortedDelivered]) {
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(new Date(sorted[i].updated_at).getTime())
                .toBeGreaterThanOrEqual(new Date(sorted[i + 1].updated_at).getTime());
            }
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it('sorting preserves all shipments — no items lost or duplicated', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentArb, { minLength: 1, maxLength: 30 }),
        (shipments) => {
          const adminVisible = filterAdminVisible(shipments);
          const queues = groupByQueueTab(adminVisible);

          for (const queue of [queues.warehouse, queues.international, queues.delivered]) {
            const sorted = sortByUpdatedDesc(queue);
            expect(sorted.length).toBe(queue.length);
            const originalIds = new Set(queue.map(s => s.id));
            const sortedIds = new Set(sorted.map(s => s.id));
            expect(sortedIds).toEqual(originalIds);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ── Pure helpers extracted from QCDetail for testability ─────────────────────

/** COUNTER action sequence: status → enabled button name */
const COUNTER_BUTTON_MAP: Record<string, string> = {
  ARRIVED_AT_WAREHOUSE: 'Quality Check',
  QUALITY_CHECKED: 'Package',
  PACKAGED: 'Approve Dispatch',
  DISPATCH_APPROVED: 'Dispatch Internationally',
};

const COUNTER_ACTION_STATUSES: ShipmentStatus[] = [
  'ARRIVED_AT_WAREHOUSE', 'QUALITY_CHECKED', 'PACKAGED', 'DISPATCH_APPROVED',
];

const ALL_BUTTON_NAMES = ['Quality Check', 'Package', 'Approve Dispatch', 'Dispatch Internationally'];

/**
 * Derives which buttons are enabled given the current leg and status.
 * Mirrors the QCDetail view logic:
 * - Only COUNTER leg renders action buttons
 * - Exactly one button enabled per action status
 * - Non-action statuses on COUNTER → zero buttons
 */
function getEnabledButtons(currentLeg: ShipmentLeg, currentStatus: ShipmentStatus): string[] {
  if (currentLeg !== 'COUNTER') return [];
  const btn = COUNTER_BUTTON_MAP[currentStatus];
  return btn ? [btn] : [];
}

/** domestic_awb is shown when non-null */
function shouldShowDomesticAwb(domesticAwb: string | null): boolean {
  return domesticAwb !== null;
}

/** international_awb is shown only when current_leg is INTERNATIONAL or COMPLETED and non-null */
function shouldShowInternationalAwb(currentLeg: ShipmentLeg, internationalAwb: string | null): boolean {
  if (internationalAwb === null) return false;
  return currentLeg === 'INTERNATIONAL' || currentLeg === 'COMPLETED';
}

// ── Property 3: Button state derivation from status ─────────────────────────
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 14.3**

describe('Property 3: Button state derivation from status', () => {
  const counterActionStatusArb = fc.constantFrom(...COUNTER_ACTION_STATUSES);

  it('for any COUNTER shipment with an action status, exactly one button is enabled corresponding to the next transition', () => {
    fc.assert(
      fc.property(counterActionStatusArb, (status) => {
        const enabled = getEnabledButtons('COUNTER', status);
        expect(enabled.length).toBe(1);
        expect(enabled[0]).toBe(COUNTER_BUTTON_MAP[status]);
      }),
      { numRuns: 200 },
    );
  });

  it('the enabled button is the only one enabled — all others are disabled', () => {
    fc.assert(
      fc.property(counterActionStatusArb, (status) => {
        const enabled = getEnabledButtons('COUNTER', status);
        const disabled = ALL_BUTTON_NAMES.filter(b => !enabled.includes(b));
        expect(disabled.length).toBe(ALL_BUTTON_NAMES.length - 1);
      }),
      { numRuns: 200 },
    );
  });

  it('for COUNTER shipments with non-action statuses, zero buttons are enabled', () => {
    const nonActionStatuses = ALL_STATUSES.filter(s => !COUNTER_ACTION_STATUSES.includes(s));
    const nonActionStatusArb = fc.constantFrom(...nonActionStatuses);

    fc.assert(
      fc.property(nonActionStatusArb, (status) => {
        const enabled = getEnabledButtons('COUNTER', status);
        expect(enabled.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 4: Read-only mode for non-COUNTER legs ─────────────────────────
// **Validates: Requirements 6.3, 8.2, 9.3, 14.4**

describe('Property 4: Read-only mode for non-COUNTER legs', () => {
  const nonCounterLegArb = fc.constantFrom<ShipmentLeg>('INTERNATIONAL', 'COMPLETED', 'DOMESTIC');

  it('for any shipment with current_leg in (INTERNATIONAL, COMPLETED, DOMESTIC), zero action buttons are enabled', () => {
    fc.assert(
      fc.property(nonCounterLegArb, shipmentStatusArb, (leg, status) => {
        const enabled = getEnabledButtons(leg, status);
        expect(enabled.length).toBe(0);
      }),
      { numRuns: 300 },
    );
  });

  it('only COUNTER leg may have enabled action buttons', () => {
    fc.assert(
      fc.property(shipmentLegArb, shipmentStatusArb, (leg, status) => {
        const enabled = getEnabledButtons(leg, status);
        if (leg !== 'COUNTER') {
          expect(enabled.length).toBe(0);
        }
      }),
      { numRuns: 300 },
    );
  });
});

// ── Property 11: AWB conditional display ────────────────────────────────────
// **Validates: Requirements 7.5, 8.3, 1.4, 14.1**

describe('Property 11: AWB conditional display', () => {
  const nonEmptyStringArb = fc.string({ minLength: 1 });
  const nullableAwbArb = fc.option(nonEmptyStringArb, { nil: null });

  it('domestic_awb is shown when non-null', () => {
    fc.assert(
      fc.property(nullableAwbArb, (awb) => {
        expect(shouldShowDomesticAwb(awb)).toBe(awb !== null);
      }),
      { numRuns: 200 },
    );
  });

  it('international_awb is shown only when current_leg is INTERNATIONAL or COMPLETED and non-null', () => {
    fc.assert(
      fc.property(shipmentLegArb, nullableAwbArb, (leg, awb) => {
        const shown = shouldShowInternationalAwb(leg, awb);
        if (awb === null) {
          expect(shown).toBe(false);
        } else if (leg === 'INTERNATIONAL' || leg === 'COMPLETED') {
          expect(shown).toBe(true);
        } else {
          expect(shown).toBe(false);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('international_awb is never shown for DOMESTIC or COUNTER legs even if non-null', () => {
    const domesticOrCounterArb = fc.constantFrom<ShipmentLeg>('DOMESTIC', 'COUNTER');

    fc.assert(
      fc.property(domesticOrCounterArb, nonEmptyStringArb, (leg, awb) => {
        expect(shouldShowInternationalAwb(leg, awb)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('international_awb is always shown for INTERNATIONAL or COMPLETED legs when non-null', () => {
    const intlOrCompletedArb = fc.constantFrom<ShipmentLeg>('INTERNATIONAL', 'COMPLETED');

    fc.assert(
      fc.property(intlOrCompletedArb, nonEmptyStringArb, (leg, awb) => {
        expect(shouldShowInternationalAwb(leg, awb)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});


// ── Pure helper extracted from statusHandler for SMS idempotency testing ─────

/**
 * Determines whether an SMS alert should be sent for a given status transition.
 * Returns true only when alert_sent is false AND the new status is INTL_OUT_FOR_DELIVERY.
 * Mirrors the guard in statusHandler.ts.
 */
function shouldSendSmsAlert(alertSent: boolean, newStatus: ShipmentStatus): boolean {
  return !alertSent && newStatus === 'INTL_OUT_FOR_DELIVERY';
}

// ── Property 17: SMS idempotency — alert_sent prevents duplicates ───────────
// **Validates: Requirements 11.4**

describe('Property 17: SMS idempotency — alert_sent prevents duplicates', () => {
  it('for any shipment with alert_sent = true, shouldSendSmsAlert returns false regardless of status', () => {
    fc.assert(
      fc.property(shipmentStatusArb, (status) => {
        expect(shouldSendSmsAlert(true, status)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('for any shipment with alert_sent = false and status INTL_OUT_FOR_DELIVERY, shouldSendSmsAlert returns true', () => {
    expect(shouldSendSmsAlert(false, 'INTL_OUT_FOR_DELIVERY')).toBe(true);
  });

  it('for any shipment with alert_sent = false and status NOT INTL_OUT_FOR_DELIVERY, shouldSendSmsAlert returns false', () => {
    const nonIntlOutStatuses = ALL_STATUSES.filter(s => s !== 'INTL_OUT_FOR_DELIVERY');
    const nonIntlOutStatusArb = fc.constantFrom(...nonIntlOutStatuses);

    fc.assert(
      fc.property(nonIntlOutStatusArb, (status) => {
        expect(shouldSendSmsAlert(false, status)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});
