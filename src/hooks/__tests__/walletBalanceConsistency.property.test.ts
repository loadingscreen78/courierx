import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Property 6: Wallet Balance Consistency**
 *
 * After a booking deduction, the wallet balance on CXBCDashboard and
 * CXBCWallet converge to the same value (both sourced from
 * `cxbc_partners.wallet_balance` via Realtime).
 *
 * Both views subscribe to the same Realtime channel
 * `cxbc_partner_{partnerId}` on the `cxbc_partners` table filtered by
 * `id=eq.{partnerId}`, event UPDATE. Both extract `wallet_balance` from
 * `payload.new`.
 *
 * This test verifies that for ANY sequence of wallet balance updates
 * (simulating booking deductions), both the Dashboard and Wallet views
 * always converge to the same final balance — specifically, the last
 * value emitted by the `cxbc_partners` Realtime channel.
 *
 * **Validates: Requirements 8.2, 5.4**
 */

// ── Types ───────────────────────────────────────────────────────────────────

interface RealtimePayload {
  new: Record<string, unknown>;
}

// ── Extracted balance extraction logic (mirrors both views) ─────────────────

/**
 * CXBCDashboard balance extraction from Realtime payload.
 *
 * Mirrors the callback in CXBCDashboard.tsx (task 4.2):
 *   if (payload.new && payload.new.wallet_balance != null) {
 *     setWalletBalance(payload.new.wallet_balance);
 *   }
 */
function dashboardExtractBalance(
  currentBalance: number,
  payload: RealtimePayload
): number {
  if (payload.new && payload.new.wallet_balance != null) {
    return payload.new.wallet_balance as number;
  }
  return currentBalance;
}

/**
 * CXBCWallet balance extraction from Realtime payload.
 *
 * Mirrors the callback in CXBCWallet.tsx (task 9.2):
 *   const updated = payload.new as Record<string, any>;
 *   if (updated && typeof updated.wallet_balance === 'number') {
 *     setWalletBalance(updated.wallet_balance);
 *   }
 */
function walletExtractBalance(
  currentBalance: number,
  payload: RealtimePayload
): number {
  const updated = payload.new;
  if (updated && typeof updated.wallet_balance === 'number') {
    return updated.wallet_balance;
  }
  return currentBalance;
}

// ── Generators ──────────────────────────────────────────────────────────────

const partnerIdArb = fc.uuid();

/** Wallet balance: non-negative, rounded to 2 decimal places */
const balanceArb = fc
  .double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
  .map((v) => Math.round(v * 100) / 100);

/** A single booking deduction amount: positive, rounded to 2 decimal places */
const deductionArb = fc
  .double({ min: 0.01, max: 50_000, noNaN: true, noDefaultInfinity: true })
  .map((v) => Math.round(v * 100) / 100);

/** A sequence of balance values as they would be emitted by Realtime after each deduction */
const balanceSequenceArb = fc.array(balanceArb, { minLength: 1, maxLength: 20 });

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 6: Wallet Balance Consistency', () => {
  it('dashboard and wallet views converge to the same balance after any sequence of Realtime updates', () => {
    /**
     * For any sequence of balance values [b1, b2, ..., bn] emitted by the
     * `cxbc_partners` Realtime channel, both views always show bn (the last
     * emitted value) and agree with each other at every step.
     */
    fc.assert(
      fc.property(
        partnerIdArb,
        balanceArb,
        balanceSequenceArb,
        (partnerId, initialBalance, balanceUpdates) => {
          let dashboardBalance = initialBalance;
          let walletBalance = initialBalance;

          for (const newBalance of balanceUpdates) {
            const payload: RealtimePayload = {
              new: { id: partnerId, wallet_balance: newBalance },
            };

            dashboardBalance = dashboardExtractBalance(dashboardBalance, payload);
            walletBalance = walletExtractBalance(walletBalance, payload);

            // PROPERTY: Both views agree at every step
            expect(dashboardBalance).toBe(walletBalance);
          }

          // PROPERTY: Both views reflect the last emitted balance
          const lastBalance = balanceUpdates[balanceUpdates.length - 1];
          expect(dashboardBalance).toBe(lastBalance);
          expect(walletBalance).toBe(lastBalance);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('a single booking deduction produces identical balance in both views', () => {
    /**
     * The simplest case: one deduction event. Both views must show the
     * post-deduction balance from the Realtime payload.
     */
    fc.assert(
      fc.property(
        partnerIdArb,
        fc
          .double({ min: 1000, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
          .map((v) => Math.round(v * 100) / 100),
        deductionArb,
        (partnerId, initialBalance, deductionAmount) => {
          const balanceAfterDeduction =
            Math.round((initialBalance - deductionAmount) * 100) / 100;

          const payload: RealtimePayload = {
            new: { id: partnerId, wallet_balance: balanceAfterDeduction },
          };

          const dashboardResult = dashboardExtractBalance(initialBalance, payload);
          const walletResult = walletExtractBalance(initialBalance, payload);

          // PROPERTY: Both views show the same post-deduction balance
          expect(dashboardResult).toBe(walletResult);
          expect(dashboardResult).toBe(balanceAfterDeduction);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('rapid sequential updates (last-write-wins): both views always show the last emitted value', () => {
    /**
     * Simulates rapid booking deductions in quick succession. The last
     * Realtime event wins — both views must converge to that final value.
     */
    fc.assert(
      fc.property(
        partnerIdArb,
        balanceArb,
        fc.array(balanceArb, { minLength: 2, maxLength: 10 }),
        (partnerId, initialBalance, rapidUpdates) => {
          let dashboardBalance = initialBalance;
          let walletBalance = initialBalance;

          for (const newBalance of rapidUpdates) {
            const payload: RealtimePayload = {
              new: { id: partnerId, wallet_balance: newBalance },
            };
            dashboardBalance = dashboardExtractBalance(dashboardBalance, payload);
            walletBalance = walletExtractBalance(walletBalance, payload);
          }

          const lastEmitted = rapidUpdates[rapidUpdates.length - 1];

          // PROPERTY: Last-write-wins — both views show the final balance
          expect(dashboardBalance).toBe(lastEmitted);
          expect(walletBalance).toBe(lastEmitted);
          // PROPERTY: Both views agree
          expect(dashboardBalance).toBe(walletBalance);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('both views ignore Realtime payloads that lack wallet_balance and retain current balance', () => {
    /**
     * If a Realtime UPDATE event for `cxbc_partners` does not include
     * `wallet_balance` (e.g., a different field changed), both views must
     * retain their current balance unchanged.
     */
    fc.assert(
      fc.property(partnerIdArb, balanceArb, (partnerId, currentBalance) => {
        // Payload without wallet_balance
        const payloadMissingField: RealtimePayload = {
          new: { id: partnerId, some_other_field: 'value' },
        };

        const dashboardResult = dashboardExtractBalance(currentBalance, payloadMissingField);
        const walletResult = walletExtractBalance(currentBalance, payloadMissingField);

        // PROPERTY: Both views retain the current balance when payload has no wallet_balance
        expect(dashboardResult).toBe(currentBalance);
        expect(walletResult).toBe(currentBalance);
        // PROPERTY: Both views agree
        expect(dashboardResult).toBe(walletResult);
      }),
      { numRuns: 100 }
    );
  });

  it('both extraction functions return the same value for any valid Realtime payload', () => {
    /**
     * Core symmetry property: the two extraction functions (Dashboard and
     * Wallet) must always return the same result when given the same payload.
     * This ensures the two views are sourced identically from Realtime.
     */
    fc.assert(
      fc.property(
        partnerIdArb,
        balanceArb,
        fc
          .double({ min: -500_000, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
          .map((v) => Math.round(v * 100) / 100),
        (partnerId, currentBalance, newBalance) => {
          const payload: RealtimePayload = {
            new: { id: partnerId, wallet_balance: newBalance },
          };

          const dashboardResult = dashboardExtractBalance(currentBalance, payload);
          const walletResult = walletExtractBalance(currentBalance, payload);

          // PROPERTY: Both extraction functions are symmetric
          expect(dashboardResult).toBe(walletResult);
          // PROPERTY: Both return the new balance from the payload
          expect(dashboardResult).toBe(newBalance);
        }
      ),
      { numRuns: 200 }
    );
  });
});
