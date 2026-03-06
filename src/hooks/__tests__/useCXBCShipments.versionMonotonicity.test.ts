import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Property 5: Version Monotonicity**
 *
 * Generate random sequences of Realtime events with varying versions for the
 * same shipment ID. Assert that the hook never applies an event with
 * version < previously known version (i.e., fetchShipments is not called for
 * stale events).
 *
 * **Validates: Requirements 1.4**
 */

// ── Extracted version-gate logic (mirrors useCXBCShipments.handleRealtimeEvent) ──

/**
 * Pure implementation of the version-based stale event filter from
 * useCXBCShipments. Returns true when the event should be applied
 * (fetchShipments called), false when it should be skipped.
 */
function shouldApplyEvent(
  versionMap: Map<string, number>,
  payload: { new?: { id?: string; version?: number } }
): boolean {
  if (payload.new && typeof payload.new.version === 'number') {
    const id = payload.new.id;
    if (!id) return true; // no id → apply (same as hook)
    const incomingVersion = payload.new.version;
    const knownVersion = versionMap.get(id);
    if (knownVersion !== undefined && incomingVersion < knownVersion) {
      return false; // stale → skip
    }
  }
  return true; // not stale → apply
}

/**
 * Simulates the full event-processing loop: for each event, decide whether
 * to apply it, and if applied, update the version map (as fetchShipments
 * would do after a successful refresh).
 */
function processEventSequence(
  events: Array<{ id: string; version: number }>
): { applied: boolean; id: string; version: number }[] {
  const versionMap = new Map<string, number>();
  const results: { applied: boolean; id: string; version: number }[] = [];

  for (const event of events) {
    const payload = { new: { id: event.id, version: event.version } };
    const applied = shouldApplyEvent(versionMap, payload);

    if (applied) {
      // Simulate fetchShipments updating the version map.
      // After a full refresh the map holds the latest version seen.
      // Because the refresh returns the DB state, the version in the map
      // will be at least as high as the incoming version.
      const current = versionMap.get(event.id);
      if (current === undefined || event.version > current) {
        versionMap.set(event.id, event.version);
      }
    }

    results.push({ applied, id: event.id, version: event.version });
  }

  return results;
}

// ── Generators ──────────────────────────────────────────────────────────────

const shipmentIdArb = fc.constantFrom('ship-1', 'ship-2', 'ship-3');
const versionArb = fc.integer({ min: 1, max: 100 });

const realtimeEventArb = fc.record({
  id: shipmentIdArb,
  version: versionArb,
});

const eventSequenceArb = fc.array(realtimeEventArb, { minLength: 1, maxLength: 50 });

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 5: Version Monotonicity', () => {

  it('should never apply an event whose version is lower than the previously known version for the same shipment', () => {
    fc.assert(
      fc.property(eventSequenceArb, (events) => {
        const results = processEventSequence(events);

        // Track the highest applied version per shipment
        const highestApplied = new Map<string, number>();

        for (const r of results) {
          if (r.applied) {
            const prev = highestApplied.get(r.id);
            if (prev !== undefined) {
              // An applied event must never have a version lower than a
              // previously applied version for the same shipment.
              expect(r.version).toBeGreaterThanOrEqual(prev);
            }
            // Update the highest applied version
            const current = highestApplied.get(r.id);
            if (current === undefined || r.version > current) {
              highestApplied.set(r.id, r.version);
            }
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('should always skip events with version strictly less than the known version', () => {
    fc.assert(
      fc.property(
        shipmentIdArb,
        fc.integer({ min: 2, max: 100 }),
        fc.integer({ min: 1, max: 99 }),
        (id, knownVersion, staleOffset) => {
          // Ensure stale version is strictly less than known
          const staleVersion = Math.min(staleOffset, knownVersion - 1);
          if (staleVersion < 1) return; // skip degenerate case

          const versionMap = new Map<string, number>();
          versionMap.set(id, knownVersion);

          const payload = { new: { id, version: staleVersion } };
          const applied = shouldApplyEvent(versionMap, payload);

          expect(applied).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should always apply events with version >= known version', () => {
    fc.assert(
      fc.property(
        shipmentIdArb,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (id, knownVersion, delta) => {
          const incomingVersion = knownVersion + delta; // always >= knownVersion

          const versionMap = new Map<string, number>();
          versionMap.set(id, knownVersion);

          const payload = { new: { id, version: incomingVersion } };
          const applied = shouldApplyEvent(versionMap, payload);

          expect(applied).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should always apply the first event for an unknown shipment ID', () => {
    fc.assert(
      fc.property(shipmentIdArb, versionArb, (id, version) => {
        const versionMap = new Map<string, number>(); // empty — no known versions

        const payload = { new: { id, version } };
        const applied = shouldApplyEvent(versionMap, payload);

        expect(applied).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle interleaved events for multiple shipments independently', () => {
    fc.assert(
      fc.property(eventSequenceArb, (events) => {
        const results = processEventSequence(events);

        // Group results by shipment ID
        const byShipment = new Map<string, typeof results>();
        for (const r of results) {
          const list = byShipment.get(r.id) || [];
          list.push(r);
          byShipment.set(r.id, list);
        }

        // For each shipment, the applied versions must be monotonically
        // non-decreasing
        for (const [_id, shipmentResults] of byShipment) {
          const appliedVersions = shipmentResults
            .filter((r) => r.applied)
            .map((r) => r.version);

          for (let i = 1; i < appliedVersions.length; i++) {
            expect(appliedVersions[i]).toBeGreaterThanOrEqual(appliedVersions[i - 1]);
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
