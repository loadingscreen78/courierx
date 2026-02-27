// Feature: vps-supabase-migration, Property 9: Docker container operational configuration
// Validates: Requirements 13.1, 13.3
//
// For any Docker Compose service in the Supabase stack, the service should have
// `restart: unless-stopped` policy configured, and logging should be configured
// with `max-size: 50m` and `max-file: 5` for JSON file driver.

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";

interface ServiceConfig {
  restart?: string;
  logging?: {
    driver?: string;
    options?: {
      "max-size"?: string;
      "max-file"?: string;
    };
  };
  [key: string]: unknown;
}

interface ComposeFile {
  services: Record<string, ServiceConfig>;
}

describe("Property 9: Docker container operational configuration", () => {
  let compose: ComposeFile;
  let serviceNames: string[];

  beforeAll(() => {
    const composePath = resolve(__dirname, "../../../migration/docker-compose.yml");
    const raw = readFileSync(composePath, "utf-8");
    compose = parse(raw) as ComposeFile;
    serviceNames = Object.keys(compose.services);
  });

  it("should have at least one service defined", () => {
    expect(serviceNames.length).toBeGreaterThan(0);
  });

  it("all services have restart: unless-stopped and logging with max-size 50m, max-file 5", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...serviceNames),
        (serviceName: string) => {
          const svc = compose.services[serviceName];

          // Restart policy must be "unless-stopped"
          expect(svc.restart).toBe("unless-stopped");

          // Logging driver must be json-file
          expect(svc.logging).toBeDefined();
          expect(svc.logging!.driver).toBe("json-file");

          // Logging options must have correct max-size and max-file
          expect(svc.logging!.options).toBeDefined();
          expect(svc.logging!.options!["max-size"]).toBe("50m");
          expect(svc.logging!.options!["max-file"]).toBe("5");
        }
      ),
      { numRuns: 100 }
    );
  });
});
