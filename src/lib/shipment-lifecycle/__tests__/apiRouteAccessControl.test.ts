import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

// ── Mock setup ──────────────────────────────────────────────────────────────

// Control what the Supabase auth mock returns per-test
let mockUser: { id: string } | null = null;
let mockAuthError: { message: string } | null = null;
let mockUserRoles: { role: string }[] = [];

vi.mock('../../shipment-lifecycle/supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => ({
        data: { user: mockUser },
        error: mockAuthError,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ data: mockUserRoles, error: null }),
            ),
          })),
        };
      }
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
        insert: vi.fn(() => ({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          })),
        })),
      };
    }),
  })),
}));

// Mock bookingService and stateMachine so they don't execute real logic
vi.mock('../../shipment-lifecycle/bookingService', () => ({
  createBooking: vi.fn().mockResolvedValue({ success: true, shipment: {} }),
  dispatchInternational: vi.fn().mockResolvedValue({ success: true, shipment: {} }),
}));

vi.mock('../../shipment-lifecycle/stateMachine', () => ({
  updateShipmentStatus: vi.fn().mockResolvedValue({ success: true, shipment: {} }),
}));

vi.mock('../../shipment-lifecycle/rateLimiter', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('../../shipment-lifecycle/backgroundSync', () => ({
  runDomesticSync: vi.fn().mockResolvedValue({ processed: 0, updated: 0, skipped: 0, errors: 0 }),
}));

vi.mock('../../shipment-lifecycle/simulationWorker', () => ({
  runSimulationWorker: vi.fn().mockResolvedValue({ processed: 0, advanced: 0, errors: 0 }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// Arbitraries
const tokenArb = fc.string({ minLength: 16, maxLength: 64 });
const userIdArb = fc.uuid();
const adminActionArb = fc.constantFrom('quality_check', 'package', 'approve_dispatch');

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: shipment-lifecycle-management, API Route Access Control Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockAuthError = null;
    mockUserRoles = [];
    // Reset CRON_SECRET for cron tests
    process.env.CRON_SECRET = 'test-cron-secret-value';
  });

  /**
   * Property 20: Customer role is rejected from admin endpoints
   *
   * For any authenticated user with only the 'customer' role (no 'admin' role),
   * calling the admin-action or dispatch endpoints should return HTTP 403 Forbidden.
   * The customer should never be able to perform admin operations regardless of
   * the token or request body provided.
   *
   * Validates: Requirements 17.1, 17.4, 17.6
   */
  describe('Property 20: Customer role is rejected from admin endpoints', () => {
    it('admin-action endpoint rejects customer role with 403 for any action', async () => {
      const { POST: adminActionPOST } = await import('../../../../app/api/shipments/admin-action/route');

      await fc.assert(
        fc.asyncProperty(
          tokenArb,
          userIdArb,
          adminActionArb,
          fc.uuid(),
          fc.integer({ min: 1, max: 100 }),
          async (token, userId, action, shipmentId, version) => {
            // Configure: authenticated user with customer role only
            mockUser = { id: userId };
            mockAuthError = null;
            mockUserRoles = [{ role: 'customer' }];

            const req = makeRequest(
              '/api/shipments/admin-action',
              { shipmentId, action, expectedVersion: version },
              { authorization: `Bearer ${token}` },
            );

            const response = await adminActionPOST(req);
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body.success).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('dispatch endpoint rejects customer role with 403', async () => {
      const { POST: dispatchPOST } = await import('../../../../app/api/shipments/dispatch/route');

      await fc.assert(
        fc.asyncProperty(
          tokenArb,
          userIdArb,
          fc.uuid(),
          fc.integer({ min: 1, max: 100 }),
          async (token, userId, shipmentId, version) => {
            // Configure: authenticated user with customer role only
            mockUser = { id: userId };
            mockAuthError = null;
            mockUserRoles = [{ role: 'customer' }];

            const req = makeRequest(
              '/api/shipments/dispatch',
              { shipmentId, expectedVersion: version },
              { authorization: `Bearer ${token}` },
            );

            const response = await dispatchPOST(req);
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body.success).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('customer with no roles is also rejected from admin endpoints', async () => {
      const { POST: adminActionPOST } = await import('../../../../app/api/shipments/admin-action/route');

      await fc.assert(
        fc.asyncProperty(
          tokenArb,
          userIdArb,
          adminActionArb,
          fc.uuid(),
          fc.integer({ min: 1, max: 100 }),
          async (token, userId, action, shipmentId, version) => {
            // Configure: authenticated user with empty roles
            mockUser = { id: userId };
            mockAuthError = null;
            mockUserRoles = [];

            const req = makeRequest(
              '/api/shipments/admin-action',
              { shipmentId, action, expectedVersion: version },
              { authorization: `Bearer ${token}` },
            );

            const response = await adminActionPOST(req);
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body.success).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });
  });


  /**
   * Property 21: Cron endpoints reject unauthenticated requests
   *
   * For any request to the domestic-sync or simulation-worker cron endpoints
   * that does NOT include the correct CRON_SECRET in the Authorization header,
   * the endpoint should return HTTP 401 Unauthorized. This includes:
   * - Missing authorization header entirely
   * - Wrong secret value
   * - Empty secret value
   *
   * Validates: Requirements 18.4, 18.5
   */
  describe('Property 21: Cron endpoints reject unauthenticated requests', () => {
    it('domestic-sync rejects requests with wrong or missing CRON_SECRET', async () => {
      const { POST: domesticSyncPOST } = await import('../../../../app/api/cron/domestic-sync/route');

      // Generate arbitrary strings that are NOT the correct secret
      const wrongSecretArb = fc.oneof(
        // Completely random string (extremely unlikely to match)
        fc.string({ minLength: 1, maxLength: 64 }).filter(s => s !== 'test-cron-secret-value'),
        // Empty string
        fc.constant(''),
      );

      await fc.assert(
        fc.asyncProperty(
          wrongSecretArb,
          async (wrongSecret) => {
            process.env.CRON_SECRET = 'test-cron-secret-value';

            const req = makeRequest(
              '/api/cron/domestic-sync',
              {},
              { authorization: `Bearer ${wrongSecret}` },
            );

            const response = await domesticSyncPOST(req);
            expect(response.status).toBe(401);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('simulation-worker rejects requests with wrong or missing CRON_SECRET', async () => {
      const { POST: simulationWorkerPOST } = await import('../../../../app/api/cron/simulation-worker/route');

      const wrongSecretArb = fc.oneof(
        fc.string({ minLength: 1, maxLength: 64 }).filter(s => s !== 'test-cron-secret-value'),
        fc.constant(''),
      );

      await fc.assert(
        fc.asyncProperty(
          wrongSecretArb,
          async (wrongSecret) => {
            process.env.CRON_SECRET = 'test-cron-secret-value';

            const req = makeRequest(
              '/api/cron/simulation-worker',
              {},
              { authorization: `Bearer ${wrongSecret}` },
            );

            const response = await simulationWorkerPOST(req);
            expect(response.status).toBe(401);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('domestic-sync rejects requests with no authorization header', async () => {
      const { POST: domesticSyncPOST } = await import('../../../../app/api/cron/domestic-sync/route');

      process.env.CRON_SECRET = 'test-cron-secret-value';

      const req = new NextRequest(new URL('/api/cron/domestic-sync', 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await domesticSyncPOST(req);
      expect(response.status).toBe(401);
    });

    it('simulation-worker rejects requests with no authorization header', async () => {
      const { POST: simulationWorkerPOST } = await import('../../../../app/api/cron/simulation-worker/route');

      process.env.CRON_SECRET = 'test-cron-secret-value';

      const req = new NextRequest(new URL('/api/cron/simulation-worker', 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await simulationWorkerPOST(req);
      expect(response.status).toBe(401);
    });

    it('cron endpoints reject when CRON_SECRET env var is unset', async () => {
      const { POST: domesticSyncPOST } = await import('../../../../app/api/cron/domestic-sync/route');
      const { POST: simulationWorkerPOST } = await import('../../../../app/api/cron/simulation-worker/route');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 64 }),
          async (anySecret) => {
            // Unset the env var
            delete process.env.CRON_SECRET;

            const syncReq = makeRequest(
              '/api/cron/domestic-sync',
              {},
              { authorization: `Bearer ${anySecret}` },
            );
            const simReq = makeRequest(
              '/api/cron/simulation-worker',
              {},
              { authorization: `Bearer ${anySecret}` },
            );

            const syncResponse = await domesticSyncPOST(syncReq);
            const simResponse = await simulationWorkerPOST(simReq);

            expect(syncResponse.status).toBe(401);
            expect(simResponse.status).toBe(401);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
