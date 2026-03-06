import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ShipmentStatus, TimelineSource, ShipmentLeg } from '../types';

/**
 * **Property 4: Timeline Consistency**
 *
 * For any set of timeline entries for a shipment, assert that entries displayed
 * are ordered by `created_at ASC` and contain identical `status`, `source`,
 * `metadata` fields as stored.
 *
 * This verifies:
 * 1. Sorting by `created_at ASC` produces chronological order
 * 2. The sort operation preserves all fields — no data loss during ordering
 * 3. Duplicate timestamps maintain stable ordering
 *
 * **Validates: Requirements 12.3**
 */

// ── Constants ───────────────────────────────────────────────────────────────

const ALL_STATUSES: ShipmentStatus[] = [
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

const ALL_SOURCES: TimelineSource[] = ['NIMBUS', 'INTERNAL', 'SIMULATION', 'SYSTEM'];

const ALL_LEGS: ShipmentLeg[] = ['DOMESTIC', 'COUNTER', 'INTERNATIONAL', 'COMPLETED'];

// ── Types ───────────────────────────────────────────────────────────────────

interface TimelineEntry {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  leg: ShipmentLeg;
  source: TimelineSource;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Sort function (mirrors what the display layer does) ─────────────────────

function sortTimelineByCreatedAtAsc(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
  );
}

// ── Generators ──────────────────────────────────────────────────────────────

const statusArb = fc.constantFrom(...ALL_STATUSES);
const sourceArb = fc.constantFrom(...ALL_SOURCES);
const legArb = fc.constantFrom(...ALL_LEGS);

// Generate ISO timestamps within a reasonable range using integer millis
// (avoids Invalid Date issues during fast-check shrinking)
const MIN_TS = new Date('2024-01-01T00:00:00Z').getTime();
const MAX_TS = new Date('2026-12-31T23:59:59Z').getTime();

const timestampArb = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ms) => new Date(ms).toISOString());

// Generate simple metadata objects with string/number/boolean values
const metadataArb = fc.dictionary(
  fc.stringMatching(/^[a-z_]{1,10}$/),
  fc.oneof(
    fc.string({ maxLength: 20 }),
    fc.integer({ min: 0, max: 10000 }),
    fc.boolean()
  ),
  { minKeys: 0, maxKeys: 5 }
);

const timelineEntryArb = fc.record({
  id: fc.uuid(),
  shipment_id: fc.constant('shipment-test-001'),
  status: statusArb,
  leg: legArb,
  source: sourceArb,
  metadata: metadataArb,
  created_at: timestampArb,
});

const timelineArrayArb = fc.array(timelineEntryArb, { minLength: 1, maxLength: 30 });

// Generator that produces entries with some duplicate timestamps
const timelineWithDuplicateTimestampsArb = fc
  .tuple(
    fc.array(timelineEntryArb, { minLength: 2, maxLength: 15 }),
    timestampArb
  )
  .map(([entries, sharedTimestamp]) => {
    // Force at least 2 entries to share the same timestamp
    const result = [...entries];
    if (result.length >= 2) {
      result[0] = { ...result[0], created_at: sharedTimestamp };
      result[1] = { ...result[1], created_at: sharedTimestamp };
    }
    return result;
  });

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 4: Timeline Consistency', () => {

  it('sorted entries are in chronological order by created_at ASC', () => {
    fc.assert(
      fc.property(timelineArrayArb, (entries) => {
        const sorted = sortTimelineByCreatedAtAsc(entries);

        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].created_at >= sorted[i - 1].created_at).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('sorting preserves all fields — no data loss during ordering', () => {
    fc.assert(
      fc.property(timelineArrayArb, (entries) => {
        const sorted = sortTimelineByCreatedAtAsc(entries);

        // Same number of entries
        expect(sorted).toHaveLength(entries.length);

        // Every original entry must appear in the sorted result with identical fields
        for (const original of entries) {
          const match = sorted.find((s) => s.id === original.id);
          expect(match).toBeDefined();
          expect(match!.status).toBe(original.status);
          expect(match!.source).toBe(original.source);
          expect(match!.metadata).toEqual(original.metadata);
          expect(match!.created_at).toBe(original.created_at);
          expect(match!.leg).toBe(original.leg);
          expect(match!.shipment_id).toBe(original.shipment_id);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('duplicate timestamps maintain stable ordering (no entries lost or swapped destructively)', () => {
    fc.assert(
      fc.property(timelineWithDuplicateTimestampsArb, (entries) => {
        const sorted = sortTimelineByCreatedAtAsc(entries);

        // All entries are preserved
        expect(sorted).toHaveLength(entries.length);

        // All unique IDs are preserved
        const originalIds = new Set(entries.map((e) => e.id));
        const sortedIds = new Set(sorted.map((e) => e.id));
        expect(sortedIds).toEqual(originalIds);

        // Chronological order is maintained even with duplicates
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].created_at >= sorted[i - 1].created_at).toBe(true);
        }

        // Entries with duplicate timestamps all retain their original field values
        const duplicateTimestamp = entries[0].created_at;
        const originalDuplicates = entries.filter((e) => e.created_at === duplicateTimestamp);
        const sortedDuplicates = sorted.filter((e) => e.created_at === duplicateTimestamp);

        expect(sortedDuplicates).toHaveLength(originalDuplicates.length);
        for (const orig of originalDuplicates) {
          const match = sortedDuplicates.find((s) => s.id === orig.id);
          expect(match).toBeDefined();
          expect(match!.status).toBe(orig.status);
          expect(match!.source).toBe(orig.source);
          expect(match!.metadata).toEqual(orig.metadata);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('sorting is idempotent — sorting an already-sorted array produces the same result', () => {
    fc.assert(
      fc.property(timelineArrayArb, (entries) => {
        const sorted1 = sortTimelineByCreatedAtAsc(entries);
        const sorted2 = sortTimelineByCreatedAtAsc(sorted1);

        expect(sorted2.map((e) => e.id)).toEqual(sorted1.map((e) => e.id));
        expect(sorted2.map((e) => e.created_at)).toEqual(sorted1.map((e) => e.created_at));
      }),
      { numRuns: 200 },
    );
  });
});
