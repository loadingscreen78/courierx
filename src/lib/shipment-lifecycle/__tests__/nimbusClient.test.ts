import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 16: Nimbus client retries on failure with exponential backoff
 *
 * For any transient failure sequence of length <= 3, the Nimbus client
 * retries with exponential backoff (1s, 3s, 9s) and succeeds if the
 * final attempt succeeds. If all 4 attempts (1 initial + 3 retries) fail,
 * the error is propagated.
 *
 * Validates: Requirements 1.6, 2.7, 9.3, 10.3, 11.1
 */

/**
 * Property 24: Token refresh on expiry
 *
 * For any Nimbus API call that receives a 401 response, the client
 * invalidates the cached token, re-authenticates, and retries with
 * the new token. Expired tokens (past expiresAt) trigger re-authentication
 * before the API call.
 *
 * Validates: Requirements 9.3, 9.4
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../apiLogger', () => ({
  logApiCall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: () => ({
    from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
  }),
}));

process.env.NIMBUS_BASE_URL = 'https://nimbus.test.local';
process.env.NIMBUS_EMAIL = 'test@test.com';
process.env.NIMBUS_PASSWORD = 'testpass';
delete process.env.NIMBUS_TOKEN;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const sampleCreateParams = {
  senderName: 'Sender',
  senderPhone: '+911234567890',
  senderAddress: '123 Street',
  recipientName: 'Recipient',
  recipientPhone: '+919876543210',
  recipientAddress: '456 Avenue',
  weightKg: 2,
  declaredValue: 500,
  shipmentType: 'document',
};

// ---------------------------------------------------------------------------
// Import module under test
// ---------------------------------------------------------------------------

import {
  authenticate,
  createShipment,
  trackShipment,
  _resetTokenCache,
  NimbusApiError,
} from '../nimbusClient';


// ---------------------------------------------------------------------------
// Property 16: Nimbus client retries on failure with exponential backoff
// ---------------------------------------------------------------------------

describe('Property 16: Nimbus client retries on failure with exponential backoff', () => {
  beforeEach(() => {
    // Use fake timers so sleep() resolves instantly when we advance
    vi.useFakeTimers();
    _resetTokenCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper: run an async operation while continuously advancing fake timers
   * so that any internal sleep() calls resolve immediately.
   * Stops advancing once the promise settles to avoid unhandled rejections.
   */
  async function runWithTimerAdvance<T>(fn: () => Promise<T>): Promise<T> {
    const promise = fn();
    let settled = false;
    promise.then(() => { settled = true; }, () => { settled = true; });
    for (let i = 0; i < 40 && !settled; i++) {
      await vi.advanceTimersByTimeAsync(10_000);
    }
    return promise;
  }

  it('succeeds on first attempt without retries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok' }))
      .mockResolvedValueOnce(jsonResponse(200, { awb: 'AWB-1' }));

    const result = await runWithTimerAdvance(() => createShipment(sampleCreateParams));
    expect(result.success).toBe(true);
    expect(result.awb).toBe('AWB-1');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('retries up to N times on transient failures then succeeds for any failCount in [1,3]', async () => {
    const samples = fc.sample(fc.integer({ min: 1, max: 3 }), 10);

    for (const failCount of samples) {
      _resetTokenCache();
      vi.restoreAllMocks();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok' }));
      for (let i = 0; i < failCount; i++) {
        fetchSpy.mockResolvedValueOnce(jsonResponse(500, { error: 'fail' }));
      }
      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { awb: 'AWB-OK' }));

      const result = await runWithTimerAdvance(() => createShipment(sampleCreateParams));
      expect(result.success).toBe(true);
      expect(result.awb).toBe('AWB-OK');
      // 1 auth + failCount failures + 1 success
      expect(fetchSpy).toHaveBeenCalledTimes(failCount + 2);
    }
  });

  it('throws after exhausting all retries for any server error status', async () => {
    const samples = fc.sample(fc.constantFrom(500, 502, 503), 10);

    for (const status of samples) {
      _resetTokenCache();
      vi.restoreAllMocks();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok' }));
      for (let i = 0; i < 4; i++) {
        fetchSpy.mockResolvedValueOnce(jsonResponse(status, { error: 'fail' }));
      }

      await expect(runWithTimerAdvance(() => createShipment(sampleCreateParams)))
        .rejects.toThrow(NimbusApiError);
      // 1 auth + 4 failed = 5
      expect(fetchSpy).toHaveBeenCalledTimes(5);
    }
  });

  it('trackShipment retries on transient failures then succeeds for any Nimbus status', async () => {
    const samples = fc.sample(
      fc.tuple(
        fc.integer({ min: 1, max: 3 }),
        fc.constantFrom('Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'),
      ),
      15,
    );

    for (const [failCount, rawStatus] of samples) {
      _resetTokenCache();
      vi.restoreAllMocks();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok' }));
      for (let i = 0; i < failCount; i++) {
        fetchSpy.mockResolvedValueOnce(jsonResponse(503, { error: 'fail' }));
      }
      fetchSpy.mockResolvedValueOnce(
        jsonResponse(200, { status: rawStatus, location: 'Mumbai', timestamp: '2026-01-01' }),
      );

      const result = await runWithTimerAdvance(() => trackShipment('AWB-TEST'));
      expect(result.success).toBe(true);
      expect(result.rawStatus).toBe(rawStatus);
    }
  });

  it('retry count never exceeds MAX_RETRIES (3) for any number of failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok' }));
    for (let i = 0; i < 10; i++) {
      fetchSpy.mockResolvedValueOnce(jsonResponse(500, { error: 'fail' }));
    }

    await expect(runWithTimerAdvance(() => trackShipment('AWB-X')))
      .rejects.toThrow(NimbusApiError);
    // 1 auth + 4 attempts = 5
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });
});


// ---------------------------------------------------------------------------
// Property 24: Token refresh on expiry
// ---------------------------------------------------------------------------

describe('Property 24: Token refresh on expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetTokenCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function runWithTimerAdvance<T>(fn: () => Promise<T>): Promise<T> {
    const promise = fn();
    let settled = false;
    promise.then(() => { settled = true; }, () => { settled = true; });
    for (let i = 0; i < 40 && !settled; i++) {
      await vi.advanceTimersByTimeAsync(10_000);
    }
    return promise;
  }

  it('re-authenticates on 401 and retries with new token for createShipment', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'old-token' }));
    fetchSpy.mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'new-token' }));
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { awb: 'AWB-REFRESHED' }));

    const result = await runWithTimerAdvance(() => createShipment(sampleCreateParams));
    expect(result.success).toBe(true);
    expect(result.awb).toBe('AWB-REFRESHED');
    expect(fetchSpy).toHaveBeenCalledTimes(4);

    const authCalls = fetchSpy.mock.calls.filter(([url]) =>
      (url as string).includes('/auth'),
    );
    expect(authCalls.length).toBe(2);
  });

  it('re-authenticates on 401 and retries with new token for trackShipment', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'old-token' }));
    fetchSpy.mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'new-token' }));
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { status: 'Delivered', location: 'Delhi' }),
    );

    const result = await runWithTimerAdvance(() => trackShipment('AWB-401'));
    expect(result.success).toBe(true);
    expect(result.rawStatus).toBe('Delivered');
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('uses cached token when not expired across multiple calls', async () => {
    const samples = fc.sample(fc.integer({ min: 2, max: 5 }), 5);

    for (const callCount of samples) {
      _resetTokenCache();
      vi.restoreAllMocks();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'cached-tok' }));
      for (let i = 0; i < callCount; i++) {
        fetchSpy.mockResolvedValueOnce(
          jsonResponse(200, { status: 'In Transit', location: 'Mumbai' }),
        );
      }

      for (let i = 0; i < callCount; i++) {
        const result = await runWithTimerAdvance(() => trackShipment(`AWB-${i}`));
        expect(result.success).toBe(true);
      }

      const authCalls = fetchSpy.mock.calls.filter(([url]) =>
        (url as string).includes('/auth'),
      );
      expect(authCalls.length).toBe(1);

      const trackCalls = fetchSpy.mock.calls.filter(([url]) =>
        (url as string).includes('/track'),
      );
      expect(trackCalls.length).toBe(callCount);
    }
  });

  it('re-authenticates when cached token has expired', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'token-1' }));
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { status: 'Picked Up', location: 'Mumbai' }),
    );

    await runWithTimerAdvance(() => trackShipment('AWB-1'));

    const authCallsBefore = fetchSpy.mock.calls.filter(([url]) =>
      (url as string).includes('/auth'),
    );
    expect(authCallsBefore.length).toBe(1);

    // Advance past 55-minute token expiry
    await vi.advanceTimersByTimeAsync(56 * 60 * 1000);

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'token-2' }));
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { status: 'Delivered', location: 'Delhi' }),
    );

    await runWithTimerAdvance(() => trackShipment('AWB-2'));

    const authCallsAfter = fetchSpy.mock.calls.filter(([url]) =>
      (url as string).includes('/auth'),
    );
    expect(authCallsAfter.length).toBe(2);
  });

  it('multiple consecutive 401s exhaust retries and throw', async () => {
    for (const operation of ['create', 'track'] as const) {
      _resetTokenCache();
      vi.restoreAllMocks();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok-1' }));

      for (let i = 0; i <= 3; i++) {
        fetchSpy.mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));
        if (i < 3) {
          fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: `tok-retry-${i}` }));
        }
      }

      if (operation === 'create') {
        await expect(runWithTimerAdvance(() => createShipment(sampleCreateParams)))
          .rejects.toThrow(NimbusApiError);
      } else {
        await expect(runWithTimerAdvance(() => trackShipment('AWB-401')))
          .rejects.toThrow(NimbusApiError);
      }
    }
  });

  it('authenticate() caches token and subsequent calls reuse it', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'my-cached-token' }));

    const token = await runWithTimerAdvance(() => authenticate());
    expect(token).toBe('my-cached-token');

    fetchSpy.mockResolvedValueOnce(
      jsonResponse(200, { status: 'In Transit', location: 'Mumbai' }),
    );
    await runWithTimerAdvance(() => trackShipment('AWB-CACHE'));

    const authCalls = fetchSpy.mock.calls.filter(([url]) =>
      (url as string).includes('/auth'),
    );
    expect(authCalls.length).toBe(1);

    const trackCall = fetchSpy.mock.calls.find(([url]) =>
      (url as string).includes('/track'),
    );
    const headers = trackCall?.[1]?.headers as Record<string, string>;
    expect(headers?.Authorization).toBe('Bearer my-cached-token');
  });
});
