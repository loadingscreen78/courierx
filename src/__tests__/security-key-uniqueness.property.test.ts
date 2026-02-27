// Feature: vps-supabase-migration, Property 11: Security key uniqueness
// Validates: Requirements 16.1
//
// For JWT secret, anon key, and service role key: verify target values are
// non-empty and different from source values.

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a .env file into a key→value map (ignores comments and blanks). */
function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

// The three security credentials that must be unique between source and target.
const CREDENTIAL_KEYS = ["JWT_SECRET", "ANON_KEY", "SERVICE_ROLE_KEY"] as const;

// Source-prefixed keys in the env file (used by migration scripts).
const SOURCE_KEY_MAP: Record<string, string> = {
  JWT_SECRET: "SOURCE_JWT_SECRET",
  ANON_KEY: "SOURCE_ANON_KEY",
  SERVICE_ROLE_KEY: "SOURCE_SERVICE_ROLE_KEY",
};

interface CredentialPair {
  name: string;
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 11: Security key uniqueness", () => {
  let pairs: CredentialPair[];
  let targetEnv: Record<string, string>;

  beforeAll(() => {
    // Resolution order: .env (post-deploy) → .env.test (dev/CI) → .env.template
    const basePath = resolve(__dirname, "../../../migration");
    const candidates = [".env", ".env.test", ".env.template"];

    let envFile = "";
    for (const name of candidates) {
      try {
        const p = resolve(basePath, name);
        readFileSync(p, "utf-8"); // existence check
        envFile = p;
        break;
      } catch {
        // try next
      }
    }

    targetEnv = parseEnvFile(envFile);

    pairs = CREDENTIAL_KEYS.map((name) => ({
      name,
      source: targetEnv[SOURCE_KEY_MAP[name]] ?? "",
      target: targetEnv[name] ?? "",
    }));
  });

  it("should have all three credential keys defined in the env file", () => {
    for (const key of CREDENTIAL_KEYS) {
      expect(targetEnv).toHaveProperty(key);
    }
  });

  it("all target credentials are non-empty and differ from source values", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...pairs),
        (pair: CredentialPair) => {
          // Target value must be non-empty
          expect(pair.target.length).toBeGreaterThan(0);

          // Source value must also be non-empty (otherwise comparison is meaningless)
          expect(pair.source.length).toBeGreaterThan(0);

          // Target value must differ from source value
          expect(pair.target).not.toBe(pair.source);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("target credentials are sufficiently long (≥ 32 characters for JWT secret)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...pairs),
        (pair: CredentialPair) => {
          if (pair.name === "JWT_SECRET") {
            // JWT secret must be at least 32 characters per design
            expect(pair.target.length).toBeGreaterThanOrEqual(32);
          } else {
            // Anon key and service role key are JWTs — typically much longer
            expect(pair.target.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no two target credentials share the same value", () => {
    const values = pairs.map((p) => p.target);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
