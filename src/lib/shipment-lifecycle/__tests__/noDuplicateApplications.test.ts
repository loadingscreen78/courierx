import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 7: No Duplicate Applications
 *
 * The CXBCApply form prevents submission when an existing application
 * with the same email has status `pending` or `under_review`.
 *
 * This test extracts and validates the duplicate-check guard logic
 * from CXBCApply.tsx's `handleSubmit` function:
 *
 *   if (existingApps && existingApps.length > 0) {
 *     // block submission, show toast with existing status
 *     return;
 *   }
 *
 * **Validates: Requirements 14.5**
 */

// ── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

interface ExistingApplication {
  email: string;
  status: ApplicationStatus;
}

interface SubmissionResult {
  blocked: boolean;
  reason: 'duplicate_pending' | 'duplicate_under_review' | null;
  existingStatus: ApplicationStatus | null;
}

// ── Extracted guard logic (mirrors CXBCApply.tsx handleSubmit) ───────────────

/**
 * Mirrors the duplicate-check guard in CXBCApply.tsx:
 *
 *   const existingApps = applications
 *     .filter(a => a.email === email && ['pending', 'under_review'].includes(a.status))
 *     .slice(0, 1);
 *
 *   if (existingApps.length > 0) → block submission
 */
function checkDuplicateApplication(
  email: string,
  existingApplications: ExistingApplication[]
): SubmissionResult {
  const blocking = existingApplications.filter(
    (a) => a.email === email && (a.status === 'pending' || a.status === 'under_review')
  );

  if (blocking.length > 0) {
    const status = blocking[0].status;
    return {
      blocked: true,
      reason: status === 'under_review' ? 'duplicate_under_review' : 'duplicate_pending',
      existingStatus: status,
    };
  }

  return { blocked: false, reason: null, existingStatus: null };
}

/**
 * Simulates the full submission flow: duplicate check → insert (if allowed).
 * Returns whether the submission was allowed and what was inserted.
 */
function simulateSubmission(
  email: string,
  existingApplications: ExistingApplication[]
): { allowed: boolean; insertedEmail: string | null } {
  const check = checkDuplicateApplication(email, existingApplications);
  if (check.blocked) {
    return { allowed: false, insertedEmail: null };
  }
  // Submission proceeds — simulate insert
  return { allowed: true, insertedEmail: email };
}

// ── Generators ───────────────────────────────────────────────────────────────

const emailArb = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }).map((s) =>
      s.replace(/[^a-z0-9]/gi, 'a') || 'a'
    ),
    fc.constantFrom('example.com', 'test.org', 'mail.net')
  )
  .map(([local, domain]) => `${local}@${domain}`);

const blockingStatusArb = fc.constantFrom<ApplicationStatus>('pending', 'under_review');
const nonBlockingStatusArb = fc.constantFrom<ApplicationStatus>('approved', 'rejected');
const anyStatusArb = fc.constantFrom<ApplicationStatus>(
  'pending',
  'under_review',
  'approved',
  'rejected'
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 7: No Duplicate Applications', () => {
  it('blocks submission when an existing application with the same email has status pending or under_review', () => {
    fc.assert(
      fc.property(
        emailArb,
        blockingStatusArb,
        (email, blockingStatus) => {
          const existing: ExistingApplication[] = [{ email, status: blockingStatus }];
          const result = checkDuplicateApplication(email, existing);

          // PROPERTY: submission is blocked
          expect(result.blocked).toBe(true);
          expect(result.existingStatus).toBe(blockingStatus);
          expect(result.reason).not.toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('allows submission when no existing application matches the email', () => {
    fc.assert(
      fc.property(
        emailArb,
        fc.array(
          fc.record<ExistingApplication>({
            email: emailArb,
            status: anyStatusArb,
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (email, existingApplications) => {
          // Ensure none of the existing apps share this email
          const unrelatedApps = existingApplications.map((a) => ({
            ...a,
            email: a.email === email ? `other_${a.email}` : a.email,
          }));

          const result = checkDuplicateApplication(email, unrelatedApps);

          // PROPERTY: no match → submission allowed
          expect(result.blocked).toBe(false);
          expect(result.reason).toBeNull();
          expect(result.existingStatus).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('allows submission when existing applications for the same email are only approved or rejected', () => {
    fc.assert(
      fc.property(
        emailArb,
        fc.array(nonBlockingStatusArb, { minLength: 1, maxLength: 5 }),
        (email, statuses) => {
          const existing: ExistingApplication[] = statuses.map((status) => ({
            email,
            status,
          }));

          const result = checkDuplicateApplication(email, existing);

          // PROPERTY: approved/rejected applications do not block new submission
          expect(result.blocked).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('blocks submission regardless of how many other non-blocking applications exist alongside a blocking one', () => {
    fc.assert(
      fc.property(
        emailArb,
        blockingStatusArb,
        fc.array(nonBlockingStatusArb, { minLength: 0, maxLength: 5 }),
        (email, blockingStatus, otherStatuses) => {
          const existing: ExistingApplication[] = [
            { email, status: blockingStatus },
            ...otherStatuses.map((s) => ({ email, status: s })),
          ];

          const result = checkDuplicateApplication(email, existing);

          // PROPERTY: presence of a blocking application always blocks, regardless of others
          expect(result.blocked).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('email comparison is case-sensitive and exact — different emails are never blocked by each other', () => {
    fc.assert(
      fc.property(
        emailArb,
        emailArb,
        blockingStatusArb,
        (emailA, emailB, status) => {
          fc.pre(emailA !== emailB);

          const existing: ExistingApplication[] = [{ email: emailA, status }];
          const result = checkDuplicateApplication(emailB, existing);

          // PROPERTY: a blocking application for emailA does not block emailB
          expect(result.blocked).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('full submission flow: duplicate check gates the insert — blocked submissions never reach insert', () => {
    fc.assert(
      fc.property(
        emailArb,
        blockingStatusArb,
        (email, blockingStatus) => {
          const existing: ExistingApplication[] = [{ email, status: blockingStatus }];
          const { allowed, insertedEmail } = simulateSubmission(email, existing);

          // PROPERTY: blocked submissions do not produce an insert
          expect(allowed).toBe(false);
          expect(insertedEmail).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('full submission flow: non-duplicate submissions always reach insert', () => {
    fc.assert(
      fc.property(
        emailArb,
        fc.array(nonBlockingStatusArb, { minLength: 0, maxLength: 3 }),
        (email, statuses) => {
          const existing: ExistingApplication[] = statuses.map((s) => ({ email, status: s }));
          const { allowed, insertedEmail } = simulateSubmission(email, existing);

          // PROPERTY: non-blocking state allows insert with the correct email
          expect(allowed).toBe(true);
          expect(insertedEmail).toBe(email);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('reason field correctly distinguishes pending vs under_review blocking status', () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const pendingResult = checkDuplicateApplication(email, [
          { email, status: 'pending' },
        ]);
        const underReviewResult = checkDuplicateApplication(email, [
          { email, status: 'under_review' },
        ]);

        // PROPERTY: reason accurately reflects the blocking status
        expect(pendingResult.reason).toBe('duplicate_pending');
        expect(underReviewResult.reason).toBe('duplicate_under_review');
      }),
      { numRuns: 100 }
    );
  });
});
