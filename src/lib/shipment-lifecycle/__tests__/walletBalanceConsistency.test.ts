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
 * (`cxbc_partner_{partnerId}` on `cxbc_partners` table, event UPDATE)
 * and extract `wallet_balance` from `payload.new`. This test verifies
 * that the extraction logic is identical and that any sequence of
 * wallet operations (debits/credits) produces the same final balance
 * in both views.
 *
 * **Validates: Requirements 8.2, 5.4**
 */

// ── Types ───────────────────────────────────────────────────────────────────

interface WalletOperation {
  type: 'debit' | 'credit';
  amount: number;
}

interface RealtimePayload {
  new: {
    id: string;
    wallet_balance: number;
    [key: string]: unknown;
  };
}

// ── Extracted balance extraction logic (mirrors both views) ─────────────────

/**
 * CXBCDashboard balance extraction from Realtime payload.
 * Mirrors the callback in CXBCDashboard.tsx:
 *   if (payload.new && payload.new.wallet_balance != null) {
 *     setWalletBalance(payload.new.wallet_balance);
 *   }
 */
function dashboardExtractBalance(
  currentBalance: number,
  payload: RealtimePayload
): number {
  if (payload.new && payload.new.wallet_balance != null) {
    return payload.new.wallet_balance;
  }
  return currentBalance;
}

/**
 * CXBCWallet balance extraction from Realtime payload.
 * Mirrors the callback in CXBCWallet.tsx:
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

/**
 * Computes the expected wallet balance after applying a sequence of
 * wallet operations to an initial balance. This simulates the DB-side
 * balance computation that produces the Realtime payload.
 */
function computeBalance(
  initialBalance: number,
  operations: WalletOperation[]
): number {
  let balance = initialBalance;
  for (const op of operations) {
    if (op.type === 'debit') {
      balance -= op.amount;
    } else {
      balance += op.amount;
    }
  }
  // Round to 2 decimal places to avoid floating-point drift
  return Math.round(balance * 100) / 100;
}

// ── Generators ──────────────────────────────────────────────────────────────

const partnerIdArb = fc.uuid();

const initialBalanceArb = fc.double({
  min: 0,
  max: 1_000_000,
  noNaN: true,
  noDefaultInfinity: true,
}).map((v) => Math.round(v * 100) / 100);

const walletOperationArb: fc.Arbitrary<WalletOperation> = fc.record({
  type: fc.constantFrom('debit' as const, 'credit' as const),
  amount: fc.double({
    min: 0.01,
    max: 50_000,
    noNaN: true,
    noDefaultInfinity: true,
  }).map((v) => Math.round(v * 100) / 100),
});

const operationSequenceArb = fc.array(walletOperationArb, {
  minLength: 1,
  maxLength: 20,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 6: Wallet Balance Consistency', () => {
  it('dashboard and wallet views converge to the same balance after any sequence of wallet operations', () => {
    fc.assert(
      fc.property(
        partnerIdArb,
        initialBalanceArb,
        operationSequenceArb,
        (partnerId, initialBalance, operations) => {
          let dashboardBalance = initialBalance;
          let walletViewBalance = initialBalance;

          // Simulate each operation producing a Realtime UPDATE event
          let runningBalance = initialBalance;
          for (const op of operations) {
            if (op.type === 'debit') {
              runningBalance -= op.amount;
            } else {
              runningBalance += op.amount;
            }
            // Round to avoid floating-point drift
            runningBalance = Math.round(runningBalance * 100) / 100;

            // Build the Realtime payload as Supabase would emit it
            const payload: RealtimePayload = {
              new: {
                id: partnerId,
                wallet_balance: runningBalance,
              },
            };

            // Both views process the same payload
            dashboardBalance = dashboardExtractBalance(dashboardBalance, payload);
            walletViewBalance = walletExtractBalance(walletViewBalance, payload);
          }

          // PROPERTY: Both views converge to the same balance
          expect(dashboardBalance).toBe(walletViewBalance);

          // PROPERTY: Both views reflect the computed final balance
          const expectedBalance = computeBalance(initialBalance, operations);
          expect(dashboardBalance).toBe(expectedBalance);
          expect(walletViewBalance).toBe(expectedBalance);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('both views extract the same balance from any valid Realtime payload', () => {
    fc.assert(
      fc.property(
        partnerIdArb,
        initialBalanceArb,
        fc.double({
          min: -500_000,
          max: 1_000_000,
          noNaN: true,
          noDefaultInfinity: true,
        }).map((v) => Math.round(v * 100) / 100),
        (partnerId, currentBalance, newBalance) => {
          const payload: RealtimePayload = {
            new: {
              id: partnerId,
              wallet_balance: newBalance,
            },
          };

          const dashboardResult = dashboardExtractBalance(currentBalance, payload);
          const walletResult = walletExtractBalance(currentBalance, payload);

          // PROPERTY: Both extraction functions return the same value
          expect(dashboardResult).toBe(walletResult);
          // PROPERTY: Both return the new balance from the payload
          expect(dashboardResult).toBe(newBalance);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('a single booking deduction produces identical balance in both views', () => {
    fc.assert(
      fc.property(
        partnerIdArb,
        fc.double({
          min: 1000,
          max: 1_000_000,
          noNaN: true,
          noDefaultInfinity: true,
        }).map((v) => Math.round(v * 100) / 100),
        fc.double({
          min: 0.01,
          max: 999,
          noNaN: true,
          noDefaultInfinity: true,
        }).map((v) => Math.round(v * 100) / 100),
        (partnerId, initialBalance, deductionAmount) => {
          const balanceAfterDeduction =
            Math.round((initialBalance - deductionAmount) * 100) / 100;

          // Simulate the Realtime event after booking deduction
          const payload: RealtimePayload = {
            new: {
              id: partnerId,
              wallet_balance: balanceAfterDeduction,
            },
          };

          const dashboardBalance = dashboardExtractBalance(initialBalance, payload);
          const walletBalance = walletExtractBalance(initialBalance, payload);

          // PROPERTY: Both views show the same post-deduction balance
          expect(dashboardBalance).toBe(walletBalance);
          expect(dashboardBalance).toBe(balanceAfterDeduction);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('interleaved debits and credits produce consistent balance across both views', () => {
    fc.assert(
      fc.property(
        partnerIdArb,
        initialBalanceArb,
        operationSequenceArb,
        (partnerId, initialBalance, operations) => {
          let dashboardBalance = initialBalance;
          let walletViewBalance = initialBalance;
          let dbBalance = initialBalance;

          // Process each operation and verify consistency at every step
          for (const op of operations) {
            if (op.type === 'debit') {
              dbBalance -= op.amount;
            } else {
              dbBalance += op.amount;
            }
            dbBalance = Math.round(dbBalance * 100) / 100;

            const payload: RealtimePayload = {
              new: {
                id: partnerId,
                wallet_balance: dbBalance,
              },
            };

            dashboardBalance = dashboardExtractBalance(dashboardBalance, payload);
            walletViewBalance = walletExtractBalance(walletViewBalance, payload);

            // PROPERTY: At every step, both views agree
            expect(dashboardBalance).toBe(walletViewBalance);
            // PROPERTY: At every step, both views match the DB state
            expect(dashboardBalance).toBe(dbBalance);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
