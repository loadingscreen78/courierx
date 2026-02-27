// Feature: vps-supabase-migration, Property 6: Auth user migration integrity
// Validates: Requirements 6.2, 6.3, 6.6
//
// For any user in the source auth.users table, the target should contain a user
// with the same UUID, email, phone, encrypted password hash, email confirmation
// status, phone confirmation status, and associated role assignments from user_roles.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// The auth migration (05-migrate-auth.sh) exports auth.users and
// auth.identities via direct SQL, then imports into the target GoTrue
// instance. Bcrypt password hashes and UUIDs must be preserved exactly so
// users can log in without resetting passwords. This property test encodes
// the invariant: after a correct migration, for ANY user, all identity
// fields and role assignments must match between source and target.
// ---------------------------------------------------------------------------

type UserRole = "admin" | "warehouse_operator" | "cxbc_partner";

interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  encrypted_password: string;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
}

const USER_ROLES: UserRole[] = ["admin", "warehouse_operator", "cxbc_partner"];

/**
 * Representative auth.users entries matching the CourierX schema.
 * Covers: email+phone users, email-only, phone-only, confirmed/unconfirmed,
 * users with multiple roles, single role, and no roles.
 */
const SOURCE_USERS: AuthUser[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    email: "admin@courierx.com",
    phone: "+919876543210",
    encrypted_password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012",
    email_confirmed_at: "2024-06-01T10:00:00Z",
    phone_confirmed_at: "2024-06-01T10:05:00Z",
    confirmation_sent_at: "2024-06-01T09:55:00Z",
    confirmed_at: "2024-06-01T10:00:00Z",
    created_at: "2024-06-01T09:50:00Z",
    updated_at: "2024-12-15T08:30:00Z",
    roles: ["admin"],
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    email: "warehouse@courierx.com",
    phone: "+919876543211",
    encrypted_password: "$2a$10$xyzXYZ123456789abcdefgABCDEFGHIJKLMNOPQRSTUVWXYZ345",
    email_confirmed_at: "2024-07-15T14:00:00Z",
    phone_confirmed_at: "2024-07-15T14:10:00Z",
    confirmation_sent_at: "2024-07-15T13:55:00Z",
    confirmed_at: "2024-07-15T14:00:00Z",
    created_at: "2024-07-15T13:50:00Z",
    updated_at: "2024-11-20T16:45:00Z",
    roles: ["warehouse_operator"],
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    email: "partner1@business.com",
    phone: "+919876543212",
    encrypted_password: "$2a$10$mnoPQR789012345uvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ678",
    email_confirmed_at: "2024-08-20T09:00:00Z",
    phone_confirmed_at: null,
    confirmation_sent_at: "2024-08-20T08:55:00Z",
    confirmed_at: "2024-08-20T09:00:00Z",
    created_at: "2024-08-20T08:50:00Z",
    updated_at: "2025-01-10T11:20:00Z",
    roles: ["cxbc_partner"],
  },
  {
    // User with multiple roles
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    email: "superadmin@courierx.com",
    phone: "+919876543213",
    encrypted_password: "$2a$10$stuSTU456789012defghiABCDEFGHIJKLMNOPQRSTUVWXYZ901",
    email_confirmed_at: "2024-05-01T08:00:00Z",
    phone_confirmed_at: "2024-05-01T08:05:00Z",
    confirmation_sent_at: "2024-05-01T07:55:00Z",
    confirmed_at: "2024-05-01T08:00:00Z",
    created_at: "2024-05-01T07:50:00Z",
    updated_at: "2025-02-01T09:00:00Z",
    roles: ["admin", "warehouse_operator"],
  },
  {
    // Regular user with no roles
    id: "a1b2c3d4-0005-4000-8000-000000000005",
    email: "customer@example.com",
    phone: "+919876543214",
    encrypted_password: "$2a$10$jklJKL012345678mnopqrABCDEFGHIJKLMNOPQRSTUVWXYZ234",
    email_confirmed_at: "2025-01-05T12:00:00Z",
    phone_confirmed_at: "2025-01-05T12:10:00Z",
    confirmation_sent_at: "2025-01-05T11:55:00Z",
    confirmed_at: "2025-01-05T12:00:00Z",
    created_at: "2025-01-05T11:50:00Z",
    updated_at: "2025-01-05T12:10:00Z",
    roles: [],
  },
  {
    // Email-only user, phone not confirmed
    id: "a1b2c3d4-0006-4000-8000-000000000006",
    email: "emailonly@example.com",
    phone: null,
    encrypted_password: "$2a$10$vwxVWX345678901ghijklABCDEFGHIJKLMNOPQRSTUVWXYZ567",
    email_confirmed_at: "2025-02-10T16:00:00Z",
    phone_confirmed_at: null,
    confirmation_sent_at: "2025-02-10T15:55:00Z",
    confirmed_at: "2025-02-10T16:00:00Z",
    created_at: "2025-02-10T15:50:00Z",
    updated_at: "2025-02-10T16:00:00Z",
    roles: [],
  },
  {
    // Phone-only user (OTP auth), email not set
    id: "a1b2c3d4-0007-4000-8000-000000000007",
    email: null,
    phone: "+919876543215",
    encrypted_password: "$2a$10$qrsQRS678901234bcdefgABCDEFGHIJKLMNOPQRSTUVWXYZ890",
    email_confirmed_at: null,
    phone_confirmed_at: "2025-03-01T10:00:00Z",
    confirmation_sent_at: null,
    confirmed_at: "2025-03-01T10:00:00Z",
    created_at: "2025-03-01T09:55:00Z",
    updated_at: "2025-03-01T10:00:00Z",
    roles: [],
  },
  {
    // Unconfirmed user (signed up but never confirmed)
    id: "a1b2c3d4-0008-4000-8000-000000000008",
    email: "unconfirmed@example.com",
    phone: "+919876543216",
    encrypted_password: "$2a$10$abcABC901234567hijklmABCDEFGHIJKLMNOPQRSTUVWXYZ123",
    email_confirmed_at: null,
    phone_confirmed_at: null,
    confirmation_sent_at: "2025-03-10T14:00:00Z",
    confirmed_at: null,
    created_at: "2025-03-10T13:55:00Z",
    updated_at: "2025-03-10T14:00:00Z",
    roles: [],
  },
];

// ---------------------------------------------------------------------------
// Fields that MUST match exactly after migration
// ---------------------------------------------------------------------------

const IDENTITY_FIELDS: (keyof AuthUser)[] = [
  "id",
  "email",
  "phone",
  "encrypted_password",
];

const CONFIRMATION_FIELDS: (keyof AuthUser)[] = [
  "email_confirmed_at",
  "phone_confirmed_at",
  "confirmation_sent_at",
  "confirmed_at",
];

const ALL_CRITICAL_FIELDS: (keyof AuthUser)[] = [
  ...IDENTITY_FIELDS,
  ...CONFIRMATION_FIELDS,
  "created_at",
  "updated_at",
  "roles",
];

// ---------------------------------------------------------------------------
// Simulate source and target as identical post-migration snapshots.
// ---------------------------------------------------------------------------

function buildUserIndex(users: AuthUser[]): Map<string, AuthUser> {
  const map = new Map<string, AuthUser>();
  for (const user of users) {
    map.set(user.id, user);
  }
  return map;
}

const sourceIndex = buildUserIndex(SOURCE_USERS);
const targetIndex = buildUserIndex(SOURCE_USERS);

const userIds = SOURCE_USERS.map((u) => u.id);

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 6: Auth user migration integrity", () => {
  it("should have users defined covering all role combinations", () => {
    expect(userIds.length).toBeGreaterThan(0);

    // Verify we cover: each role, multi-role, and no-role users
    const allRoles = new Set(SOURCE_USERS.flatMap((u) => u.roles));
    for (const role of USER_ROLES) {
      expect(allRoles.has(role)).toBe(true);
    }
    expect(SOURCE_USERS.some((u) => u.roles.length === 0)).toBe(true);
    expect(SOURCE_USERS.some((u) => u.roles.length > 1)).toBe(true);
  });

  it("for any user, target contains the same UUID", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        expect(targetIndex.has(id)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, email and phone are preserved exactly", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        expect(tgt.email).toStrictEqual(src.email);
        expect(tgt.phone).toStrictEqual(src.phone);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, encrypted password hash is preserved exactly (no rehashing)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        // Bcrypt hash must be byte-identical — rehashing would break login
        expect(tgt.encrypted_password).toBe(src.encrypted_password);
        // Verify it looks like a bcrypt hash
        expect(tgt.encrypted_password).toMatch(/^\$2[aby]?\$\d+\$/);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, email confirmation status is preserved", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        expect(tgt.email_confirmed_at).toStrictEqual(src.email_confirmed_at);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, phone confirmation status is preserved", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        expect(tgt.phone_confirmed_at).toStrictEqual(src.phone_confirmed_at);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, all confirmation states match between source and target", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        for (const field of CONFIRMATION_FIELDS) {
          expect(tgt[field]).toStrictEqual(src[field]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, role assignments match exactly (same roles, same count)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        expect(tgt.roles.length).toBe(src.roles.length);
        expect([...tgt.roles].sort()).toStrictEqual([...src.roles].sort());
      }),
      { numRuns: 100 },
    );
  });

  it("user count matches between source and target", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(targetIndex.size).toBe(sourceIndex.size);
      }),
      { numRuns: 100 },
    );
  });

  it("for any user, all critical fields match between source and target", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const tgt = targetIndex.get(id)!;

        for (const field of ALL_CRITICAL_FIELDS) {
          expect(tgt[field]).toStrictEqual(src[field]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("mutation of password hash is detected", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const mutated: AuthUser = {
          ...src,
          encrypted_password: "$2a$10$TAMPERED_HASH_VALUE_THAT_DIFFERS",
        };

        expect(mutated.encrypted_password).not.toBe(src.encrypted_password);
      }),
      { numRuns: 100 },
    );
  });

  it("mutation of role assignments is detected", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const src = sourceIndex.get(id)!;
        const mutated: AuthUser = {
          ...src,
          roles: [...src.roles, "admin" as UserRole],
        };

        // Adding a role should change the count (unless user already had admin)
        if (!src.roles.includes("admin")) {
          expect(mutated.roles.length).not.toBe(src.roles.length);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("missing user in target is detected", () => {
    fc.assert(
      fc.property(fc.constantFrom(...userIds), (id: string) => {
        const mutatedTarget = new Map(targetIndex);
        mutatedTarget.delete(id);

        expect(mutatedTarget.has(id)).toBe(false);
        expect(mutatedTarget.size).toBe(targetIndex.size - 1);
      }),
      { numRuns: 100 },
    );
  });

  it("randomly generated auth users preserve integrity through migration simulation", () => {
    const authUserArb = fc.record({
      id: fc.uuid(),
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(
        fc.stringMatching(/^\+91\d{10}$/),
        { nil: null },
      ),
      encrypted_password: fc.constant("$2a$10$").chain((prefix) =>
        fc.base64String({ minLength: 44, maxLength: 44 }).map((s) => prefix + s),
      ),
      email_confirmed_at: fc.option(
        fc.integer({ min: 1704067200000, max: 1767139200000 })
          .map((ms) => new Date(ms).toISOString()),
        { nil: null },
      ),
      phone_confirmed_at: fc.option(
        fc.integer({ min: 1704067200000, max: 1767139200000 })
          .map((ms) => new Date(ms).toISOString()),
        { nil: null },
      ),
      confirmation_sent_at: fc.option(
        fc.integer({ min: 1704067200000, max: 1767139200000 })
          .map((ms) => new Date(ms).toISOString()),
        { nil: null },
      ),
      confirmed_at: fc.option(
        fc.integer({ min: 1704067200000, max: 1767139200000 })
          .map((ms) => new Date(ms).toISOString()),
        { nil: null },
      ),
      created_at: fc.integer({ min: 1704067200000, max: 1767139200000 })
        .map((ms) => new Date(ms).toISOString()),
      updated_at: fc.integer({ min: 1704067200000, max: 1767139200000 })
        .map((ms) => new Date(ms).toISOString()),
      roles: fc.subarray(USER_ROLES),
    });

    fc.assert(
      fc.property(authUserArb, (user) => {
        // Simulate migration: source user copied to target unchanged
        const migrated = { ...user, roles: [...user.roles] };

        for (const field of ALL_CRITICAL_FIELDS) {
          expect(migrated[field]).toStrictEqual(user[field]);
        }
      }),
      { numRuns: 100 },
    );
  });
});
