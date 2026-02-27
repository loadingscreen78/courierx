import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { checkRateLimit, resetRateLimiter } from '../rateLimiter';

/**
 * Property 15: Rate limiter enforces request ceiling
 *
 * For any user and action, the rate limiter allows up to the configured
 * limit of requests within a 1-minute window, then rejects subsequent
 * requests with allowed=false and a non-negative retryAfterMs.
 *
 * Configured limits:
 *   - booking: 5 requests/min
 *   - quality_check, package, approve_dispatch: 3 requests/min
 *   - default: 5 requests/min
 *
 * Validates: Requirements 1.9, 3.7, 10.1, 10.4, 10.5
 */

const ACTION_LIMITS: Record<string, number> = {
  booking: 5,
  quality_check: 3,
  package: 3,
  approve_dispatch: 3,
};
const DEFAULT_LIMIT = 5;

function getExpectedLimit(action: string): number {
  return ACTION_LIMITS[action] ?? DEFAULT_LIMIT;
}

const knownActionArb = fc.constantFrom('booking', 'quality_check', 'package', 'approve_dispatch');
const userIdArb = fc.string({ minLength: 1, maxLength: 20 });

describe('Property 15: Rate limiter enforces request ceiling', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows exactly N requests then rejects for any known action and user', () => {
    fc.assert(
      fc.property(userIdArb, knownActionArb, (userId, action) => {
        resetRateLimiter();
        const limit = getExpectedLimit(action);

        // First `limit` requests should all be allowed
        for (let i = 0; i < limit; i++) {
          const result = checkRateLimit(userId, action);
          expect(result.allowed).toBe(true);
        }

        // The next request should be rejected
        const rejected = checkRateLimit(userId, action);
        expect(rejected.allowed).toBe(false);
        expect(rejected.retryAfterMs).toBeDefined();
        expect(rejected.retryAfterMs!).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('different users have independent rate limits', () => {
    fc.assert(
      fc.property(
        userIdArb,
        userIdArb.filter((u) => u.length > 0),
        knownActionArb,
        (userA, userB, action) => {
          // Ensure distinct users
          if (userA === userB) return;
          resetRateLimiter();
          const limit = getExpectedLimit(action);

          // Exhaust userA's limit
          for (let i = 0; i < limit; i++) {
            checkRateLimit(userA, action);
          }
          expect(checkRateLimit(userA, action).allowed).toBe(false);

          // userB should still be allowed
          const result = checkRateLimit(userB, action);
          expect(result.allowed).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('different actions for the same user have independent limits', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.constant('booking'),
        fc.constant('quality_check'),
        (userId, actionA, actionB) => {
          resetRateLimiter();

          // Exhaust booking limit (5)
          for (let i = 0; i < 5; i++) {
            checkRateLimit(userId, actionA);
          }
          expect(checkRateLimit(userId, actionA).allowed).toBe(false);

          // quality_check should still be allowed for the same user
          const result = checkRateLimit(userId, actionB);
          expect(result.allowed).toBe(true);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('booking action enforces exactly 5 requests/min', () => {
    fc.assert(
      fc.property(userIdArb, (userId) => {
        resetRateLimiter();

        for (let i = 0; i < 5; i++) {
          expect(checkRateLimit(userId, 'booking').allowed).toBe(true);
        }
        expect(checkRateLimit(userId, 'booking').allowed).toBe(false);
      }),
      { numRuns: 50 },
    );
  });

  it('admin actions enforce exactly 3 requests/min', () => {
    const adminActionArb = fc.constantFrom('quality_check', 'package', 'approve_dispatch');

    fc.assert(
      fc.property(userIdArb, adminActionArb, (userId, action) => {
        resetRateLimiter();

        for (let i = 0; i < 3; i++) {
          expect(checkRateLimit(userId, action).allowed).toBe(true);
        }
        expect(checkRateLimit(userId, action).allowed).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('rejected requests return retryAfterMs within [0, 60000]', () => {
    fc.assert(
      fc.property(userIdArb, knownActionArb, (userId, action) => {
        resetRateLimiter();
        const limit = getExpectedLimit(action);

        // Exhaust the limit
        for (let i = 0; i < limit; i++) {
          checkRateLimit(userId, action);
        }

        const rejected = checkRateLimit(userId, action);
        expect(rejected.allowed).toBe(false);
        expect(rejected.retryAfterMs).toBeGreaterThanOrEqual(0);
        expect(rejected.retryAfterMs).toBeLessThanOrEqual(60_000);
      }),
      { numRuns: 100 },
    );
  });
});
