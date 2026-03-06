import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Property 1: Login Idempotency**
 *
 * For any approved partner with email E, regardless of `user_id` match state,
 * logging in with email E grants CXBC access and auto-links `user_id`.
 *
 * This test extracts the pure dual-lookup logic from `useCXBCAuth` and
 * `cxbcDualLookup` (Auth.tsx) and verifies the property across all possible
 * user_id match states: matching, null, or different.
 *
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

// ── Types ───────────────────────────────────────────────────────────────────

interface PartnerRecord {
  id: string;
  user_id: string | null;
  email: string;
  status: string;
}

interface DualLookupResult {
  isApprovedPartner: boolean;
  partner: PartnerRecord | null;
  autoLinked: boolean;
  linkedUserId: string | null;
}

// ── Extracted dual-lookup logic (mirrors useCXBCAuth + cxbcDualLookup) ─────

/**
 * Pure implementation of the dual-lookup algorithm used by both
 * `useCXBCAuth` hook and `cxbcDualLookup` in Auth.tsx.
 *
 * Given a database of partner records, a current user ID, and a current
 * user email, this function determines:
 * 1. Whether the user is an approved partner
 * 2. Which partner record matched
 * 3. Whether auto-linking was performed
 * 4. What user_id was linked
 */
function dualLookup(
  partners: PartnerRecord[],
  currentUserId: string,
  currentUserEmail: string
): DualLookupResult {
  // Step 1: Query by user_id first
  const byUserId = partners.find(
    (p) => p.user_id === currentUserId && p.status === 'approved'
  );

  if (byUserId) {
    return {
      isApprovedPartner: true,
      partner: byUserId,
      autoLinked: false,
      linkedUserId: byUserId.user_id,
    };
  }

  // Step 2: Fallback — query by email
  const byEmail = partners.find(
    (p) => p.email === currentUserEmail && p.status === 'approved'
  );

  if (byEmail) {
    // Step 3: Auto-link if user_id is null or mismatched
    const needsLink = !byEmail.user_id || byEmail.user_id !== currentUserId;
    return {
      isApprovedPartner: true,
      partner: byEmail,
      autoLinked: needsLink,
      linkedUserId: currentUserId, // After linking, user_id = currentUserId
    };
  }

  // No approved partner found
  return {
    isApprovedPartner: false,
    partner: null,
    autoLinked: false,
    linkedUserId: null,
  };
}

// ── Generators ──────────────────────────────────────────────────────────────

/** The three possible user_id match states for an approved partner record */
type UserIdMatchState = 'matching' | 'null' | 'different';

const userIdMatchStateArb: fc.Arbitrary<UserIdMatchState> = fc.constantFrom(
  'matching' as const,
  'null' as const,
  'different' as const
);

const emailArb = fc.emailAddress();
const uuidArb = fc.uuid();

/**
 * Generates a scenario: an approved partner with a given email and a
 * user_id in one of three states relative to the current user.
 */
const loginScenarioArb = fc.record({
  partnerEmail: emailArb,
  partnerId: uuidArb,
  currentUserId: uuidArb,
  userIdMatchState: userIdMatchStateArb,
  differentUserId: uuidArb,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 1: Login Idempotency', () => {
  it('grants CXBC access for any approved partner regardless of user_id match state', () => {
    fc.assert(
      fc.property(loginScenarioArb, (scenario) => {
        const { partnerEmail, partnerId, currentUserId, userIdMatchState, differentUserId } =
          scenario;

        // Build the partner record based on the user_id match state
        let partnerUserId: string | null;
        switch (userIdMatchState) {
          case 'matching':
            partnerUserId = currentUserId;
            break;
          case 'null':
            partnerUserId = null;
            break;
          case 'different':
            // Ensure the different user_id is actually different
            partnerUserId = differentUserId === currentUserId
              ? differentUserId + '-other'
              : differentUserId;
            break;
        }

        const partners: PartnerRecord[] = [
          {
            id: partnerId,
            user_id: partnerUserId,
            email: partnerEmail,
            status: 'approved',
          },
        ];

        const result = dualLookup(partners, currentUserId, partnerEmail);

        // PROPERTY: Access is always granted for an approved partner with matching email
        expect(result.isApprovedPartner).toBe(true);
        expect(result.partner).not.toBeNull();
        expect(result.partner!.id).toBe(partnerId);
      }),
      { numRuns: 200 },
    );
  });

  it('auto-links user_id when partner is found by email with null or mismatched user_id', () => {
    fc.assert(
      fc.property(loginScenarioArb, (scenario) => {
        const { partnerEmail, partnerId, currentUserId, userIdMatchState, differentUserId } =
          scenario;

        let partnerUserId: string | null;
        switch (userIdMatchState) {
          case 'matching':
            partnerUserId = currentUserId;
            break;
          case 'null':
            partnerUserId = null;
            break;
          case 'different':
            partnerUserId = differentUserId === currentUserId
              ? differentUserId + '-other'
              : differentUserId;
            break;
        }

        const partners: PartnerRecord[] = [
          {
            id: partnerId,
            user_id: partnerUserId,
            email: partnerEmail,
            status: 'approved',
          },
        ];

        const result = dualLookup(partners, currentUserId, partnerEmail);

        // PROPERTY: After dual-lookup, the linked user_id is always the current user
        expect(result.linkedUserId).toBe(currentUserId);

        // Auto-linking happens only when user_id was null or different
        if (userIdMatchState === 'matching') {
          // Found by user_id directly — no auto-link needed
          expect(result.autoLinked).toBe(false);
        } else {
          // Found by email — auto-link performed
          expect(result.autoLinked).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('repeated logins with the same email always produce the same access decision', () => {
    fc.assert(
      fc.property(
        loginScenarioArb,
        fc.integer({ min: 2, max: 5 }),
        (scenario, repeatCount) => {
          const { partnerEmail, partnerId, currentUserId, userIdMatchState, differentUserId } =
            scenario;

          let partnerUserId: string | null;
          switch (userIdMatchState) {
            case 'matching':
              partnerUserId = currentUserId;
              break;
            case 'null':
              partnerUserId = null;
              break;
            case 'different':
              partnerUserId = differentUserId === currentUserId
                ? differentUserId + '-other'
                : differentUserId;
              break;
          }

          const partners: PartnerRecord[] = [
            {
              id: partnerId,
              user_id: partnerUserId,
              email: partnerEmail,
              status: 'approved',
            },
          ];

          // Simulate repeated logins — each should grant access
          const results: DualLookupResult[] = [];
          for (let i = 0; i < repeatCount; i++) {
            results.push(dualLookup(partners, currentUserId, partnerEmail));

            // After first login, simulate the auto-link effect:
            // the partner's user_id is now the current user's ID
            if (results[i].autoLinked) {
              partners[0].user_id = currentUserId;
            }
          }

          // PROPERTY: Every login attempt grants access (idempotency)
          for (const r of results) {
            expect(r.isApprovedPartner).toBe(true);
            expect(r.partner).not.toBeNull();
          }

          // After the first login, subsequent logins should find by user_id
          // and not need auto-linking
          for (let i = 1; i < results.length; i++) {
            expect(results[i].autoLinked).toBe(false);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('does not grant access when no approved partner exists for the email', () => {
    fc.assert(
      fc.property(
        uuidArb,
        emailArb,
        emailArb,
        (currentUserId, currentUserEmail, otherEmail) => {
          // Only create a partner with a different email
          fc.pre(currentUserEmail !== otherEmail);

          const partners: PartnerRecord[] = [
            {
              id: 'partner-other',
              user_id: null,
              email: otherEmail,
              status: 'approved',
            },
          ];

          const result = dualLookup(partners, currentUserId, currentUserEmail);

          // PROPERTY: No access when email doesn't match any approved partner
          expect(result.isApprovedPartner).toBe(false);
          expect(result.partner).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
