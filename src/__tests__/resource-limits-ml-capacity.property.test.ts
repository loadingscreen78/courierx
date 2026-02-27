// Feature: vps-supabase-migration, Property 10: Resource limits reserve capacity for ML workloads
// Validates: Requirements 15.1
//
// For any set of Docker Compose resource limits across all Supabase services,
// the sum of CPU limits should not exceed 70% of total VPS CPUs, and the sum
// of memory limits should not exceed 70% of total VPS RAM, leaving at least
// 30% for future ML workloads.

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";

// VPS baseline from Requirement 1.3: minimum 4 GB RAM, 2 vCPUs
// Design specifies a 4 vCPU / 8 GB VPS as the target
const VPS_TOTAL_CPUS = 4;
const VPS_TOTAL_MEMORY_MB = 8 * 1024; // 8 GB in MB
const MAX_RATIO = 0.7; // 70% cap

interface DeployConfig {
  resources?: {
    limits?: {
      cpus?: string;
      memory?: string;
    };
  };
}

interface ServiceConfig {
  deploy?: DeployConfig;
  [key: string]: unknown;
}

interface ComposeFile {
  services: Record<string, ServiceConfig>;
}

/** Parse a Docker memory string (e.g. "256M", "2G") to megabytes. */
function parseMemoryMB(mem: string): number {
  const upper = mem.trim().toUpperCase();
  const num = parseFloat(upper);
  if (upper.endsWith("G")) return num * 1024;
  if (upper.endsWith("M")) return num;
  if (upper.endsWith("K")) return num / 1024;
  return num / (1024 * 1024); // assume bytes
}

describe("Property 10: Resource limits reserve capacity for ML workloads", () => {
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

  it("every service must declare CPU and memory limits", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...serviceNames),
        (serviceName: string) => {
          const svc = compose.services[serviceName];
          expect(svc.deploy).toBeDefined();
          expect(svc.deploy!.resources).toBeDefined();
          expect(svc.deploy!.resources!.limits).toBeDefined();
          expect(svc.deploy!.resources!.limits!.cpus).toBeDefined();
          expect(svc.deploy!.resources!.limits!.memory).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("total CPU limits across all services must not exceed 70% of VPS CPUs", () => {
    const totalCpus = serviceNames.reduce((sum, name) => {
      const cpus = parseFloat(compose.services[name].deploy!.resources!.limits!.cpus!);
      return sum + cpus;
    }, 0);

    const maxAllowed = VPS_TOTAL_CPUS * MAX_RATIO;
    expect(totalCpus).toBeLessThanOrEqual(maxAllowed);
  });

  it("total memory limits across all services must not exceed 70% of VPS RAM", () => {
    const totalMemoryMB = serviceNames.reduce((sum, name) => {
      const mem = compose.services[name].deploy!.resources!.limits!.memory!;
      return sum + parseMemoryMB(mem);
    }, 0);

    const maxAllowedMB = VPS_TOTAL_MEMORY_MB * MAX_RATIO;
    expect(totalMemoryMB).toBeLessThanOrEqual(maxAllowedMB);
  });

  it("no arbitrary subset of services exceeds the 70% resource cap", () => {
    fc.assert(
      fc.property(
        fc.subarray(serviceNames, { minLength: 1 }),
        (subset: string[]) => {
          const subsetCpus = subset.reduce((sum, name) => {
            return sum + parseFloat(compose.services[name].deploy!.resources!.limits!.cpus!);
          }, 0);
          const subsetMemMB = subset.reduce((sum, name) => {
            return sum + parseMemoryMB(compose.services[name].deploy!.resources!.limits!.memory!);
          }, 0);

          // If a subset exceeds the cap, the full set certainly does too.
          // This property checks that even the full set (which is one possible subset) stays within bounds.
          const totalCpus = serviceNames.reduce((s, n) => s + parseFloat(compose.services[n].deploy!.resources!.limits!.cpus!), 0);
          const totalMemMB = serviceNames.reduce((s, n) => s + parseMemoryMB(compose.services[n].deploy!.resources!.limits!.memory!), 0);

          expect(totalCpus).toBeLessThanOrEqual(VPS_TOTAL_CPUS * MAX_RATIO);
          expect(totalMemMB).toBeLessThanOrEqual(VPS_TOTAL_MEMORY_MB * MAX_RATIO);

          // Additionally: any subset's sum must be ≤ total (sanity)
          expect(subsetCpus).toBeLessThanOrEqual(totalCpus);
          expect(subsetMemMB).toBeLessThanOrEqual(totalMemMB);
        }
      ),
      { numRuns: 100 }
    );
  });
});
