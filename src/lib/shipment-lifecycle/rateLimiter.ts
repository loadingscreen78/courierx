/**
 * Sliding window rate limiter with in-memory store.
 * - /api/shipments/book: 5 requests/min/user
 * - /api/shipments/admin-action: 3 requests/min/action-type
 *
 * Requirements: 1.9, 3.7, 10.1, 10.4, 10.5
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

interface WindowEntry {
  timestamps: number[];
}

const WINDOW_MS = 60_000; // 1 minute

const RATE_LIMITS: Record<string, number> = {
  booking: 5,
  quality_check: 3,
  package: 3,
  approve_dispatch: 3,
};

const DEFAULT_LIMIT = 5;

// In-memory store keyed by `${userId}:${action}`
const store = new Map<string, WindowEntry>();

function getLimit(action: string): number {
  return RATE_LIMITS[action] ?? DEFAULT_LIMIT;
}

function pruneExpired(entry: WindowEntry, now: number): void {
  const cutoff = now - WINDOW_MS;
  // Find first index that's within the window
  let i = 0;
  while (i < entry.timestamps.length && entry.timestamps[i] <= cutoff) {
    i++;
  }
  if (i > 0) {
    entry.timestamps.splice(0, i);
  }
}

export function checkRateLimit(userId: string, action: string): RateLimitResult {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const limit = getLimit(action);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  pruneExpired(entry, now);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

/** Clears all rate limit state. Useful for testing. */
export function resetRateLimiter(): void {
  store.clear();
}
