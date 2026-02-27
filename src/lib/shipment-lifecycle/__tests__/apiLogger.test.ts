import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { maskSensitiveFields, logApiCall } from '../apiLogger';

/**
 * Property 14: API logging masks sensitive fields
 *
 * For any payload containing keys matching token, password, phone, email,
 * aadhaar, or pan, maskSensitiveFields replaces their values with '***'
 * and preserves all non-sensitive fields unchanged.
 *
 * Validates: Requirements 1.7, 9.5, 12.2
 */

/**
 * Property 23: API log entries contain all required fields
 *
 * For any external API call, the resulting api_logs row contains non-null
 * values for api_type, request_payload, response_payload, http_status,
 * execution_time_ms, and correlation_id.
 *
 * Validates: Requirements 12.1, 12.4
 */

const SENSITIVE_KEY_NAMES = ['token', 'password', 'phone', 'email', 'aadhaar', 'pan'];
const SENSITIVE_PATTERN = /token|password|phone|email|aadhaar|pan/i;

// Filter out __proto__ which causes issues with Object.keys
const noProtoKey = (k: string) => k !== '__proto__' && k !== 'constructor';

// Arbitrary that generates a payload with at least one sensitive key
const sensitivePayloadArb = fc.dictionary(
  fc.constantFrom(...SENSITIVE_KEY_NAMES),
  fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  { minKeys: 1 },
).filter((d) => Object.keys(d).length > 0);

// Arbitrary for non-sensitive keys (no overlap with sensitive patterns)
const safeKeyArb = fc.constantFrom('name', 'city', 'zip', 'country', 'weight', 'status', 'id', 'ref', 'data', 'msg');

// Arbitrary for a payload mixing sensitive and non-sensitive keys
const mixedPayloadArb = fc.tuple(
  fc.dictionary(fc.constantFrom(...SENSITIVE_KEY_NAMES), fc.string(), { minKeys: 1 }),
  fc.dictionary(safeKeyArb, fc.oneof(fc.string(), fc.integer(), fc.boolean()), { minKeys: 0 }),
).map(([sensitive, safe]) => ({ ...sensitive, ...safe }))
  .filter((d) => Object.keys(d).every(noProtoKey));

describe('Property 14: API logging masks sensitive fields', () => {
  it('all sensitive keys are replaced with "***"', () => {
    fc.assert(
      fc.property(sensitivePayloadArb, (payload) => {
        const masked = maskSensitiveFields(payload as Record<string, unknown>);

        for (const key of Object.keys(masked)) {
          if (SENSITIVE_PATTERN.test(key)) {
            expect(masked[key]).toBe('***');
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('non-sensitive fields are preserved unchanged', () => {
    fc.assert(
      fc.property(mixedPayloadArb, (payload) => {
        const masked = maskSensitiveFields(payload as Record<string, unknown>);

        for (const [key, value] of Object.entries(payload)) {
          if (!SENSITIVE_PATTERN.test(key)) {
            expect(masked[key]).toEqual(value);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('nested sensitive fields are masked recursively', () => {
    fc.assert(
      fc.property(
        fc.record({
          safeOuter: fc.string(),
          nested: fc.record({
            token: fc.string(),
            password: fc.string(),
            safeInner: fc.integer(),
          }),
        }),
        (payload) => {
          const masked = maskSensitiveFields(payload as Record<string, unknown>);
          const nestedMasked = masked.nested as Record<string, unknown>;

          expect(nestedMasked.token).toBe('***');
          expect(nestedMasked.password).toBe('***');
          expect(nestedMasked.safeInner).toBe(
            (payload.nested as Record<string, unknown>).safeInner,
          );
          expect(masked.safeOuter).toBe(payload.safeOuter);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sensitive fields inside arrays are masked', () => {
    fc.assert(
      fc.property(
        fc.record({
          items: fc.array(
            fc.record({ email: fc.string(), name: fc.string() }),
            { minLength: 1, maxLength: 5 },
          ),
        }),
        (payload) => {
          const masked = maskSensitiveFields(payload as Record<string, unknown>);
          const items = masked.items as Record<string, unknown>[];

          for (const item of items) {
            expect(item.email).toBe('***');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('output has the same set of keys as input', () => {
    fc.assert(
      fc.property(mixedPayloadArb, (payload) => {
        const masked = maskSensitiveFields(payload as Record<string, unknown>);
        expect(Object.keys(masked).sort()).toEqual(Object.keys(payload).sort());
      }),
      { numRuns: 200 },
    );
  });
});

// --- Property 23: API log entries contain all required fields ---

// Mock the Supabase service role client
let capturedRows: Record<string, unknown>[] = [];
const mockInsert = vi.fn().mockImplementation((row: Record<string, unknown>) => {
  capturedRows.push(row);
  return Promise.resolve({ error: null });
});

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: () => ({
    from: () => ({ insert: mockInsert }),
  }),
}));

const apiTypeArb = fc.constantFrom<'nimbus_create' | 'nimbus_track' | 'nimbus_auth'>(
  'nimbus_create',
  'nimbus_track',
  'nimbus_auth',
);

describe('Property 23: API log entries contain all required fields', () => {
  beforeEach(() => {
    capturedRows = [];
    mockInsert.mockClear();
  });

  it('every logApiCall invocation inserts a row with all required fields', async () => {
    // Run iterations manually to properly reset mocks between each
    const arb = fc.record({
      shipmentId: fc.oneof(fc.uuid(), fc.constant(null)),
      apiType: apiTypeArb,
      requestPayload: fc.constant({ data: 'test' }),
      responsePayload: fc.constant({ result: 'ok' }),
      httpStatus: fc.integer({ min: 100, max: 599 }),
      executionTimeMs: fc.integer({ min: 0, max: 60000 }),
      correlationId: fc.uuid(),
    });

    fc.assert(
      fc.property(arb, (params) => {
        mockInsert.mockClear();
        capturedRows = [];

        // Call synchronously-returning mock path — logApiCall is async but
        // we only need to verify the insert argument shape
        mockInsert.mockReturnValue(Promise.resolve({ error: null }));

        // We can't await inside fc.property, so we call and check the mock synchronously
        // since the mock resolves immediately
        logApiCall(params);

        expect(mockInsert).toHaveBeenCalledTimes(1);
        const row = mockInsert.mock.calls[0][0];

        expect(row.api_type).toBe(params.apiType);
        expect(row.request_payload).toBeDefined();
        expect(row.request_payload).not.toBeNull();
        expect(row.response_payload).toBeDefined();
        expect(row.response_payload).not.toBeNull();
        expect(typeof row.http_status).toBe('number');
        expect(typeof row.execution_time_ms).toBe('number');
        expect(typeof row.correlation_id).toBe('string');
        expect(row.correlation_id.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('sensitive fields in payloads are masked before insertion', () => {
    const arb = fc.record({
      shipmentId: fc.uuid(),
      apiType: apiTypeArb,
      requestPayload: fc.record({
        token: fc.string(),
        password: fc.string(),
        name: fc.string(),
      }),
      responsePayload: fc.record({
        email: fc.string(),
        data: fc.string(),
      }),
      httpStatus: fc.constant(200),
      executionTimeMs: fc.integer({ min: 0, max: 5000 }),
      correlationId: fc.uuid(),
    });

    fc.assert(
      fc.property(arb, (params) => {
        mockInsert.mockClear();
        mockInsert.mockReturnValue(Promise.resolve({ error: null }));

        logApiCall(params);

        expect(mockInsert).toHaveBeenCalledTimes(1);
        const row = mockInsert.mock.calls[0][0];

        // Sensitive fields in request should be masked
        expect(row.request_payload.token).toBe('***');
        expect(row.request_payload.password).toBe('***');
        // Non-sensitive field preserved
        expect(row.request_payload.name).toBe(
          (params.requestPayload as Record<string, unknown>).name,
        );

        // Sensitive fields in response should be masked
        expect(row.response_payload.email).toBe('***');
        // Non-sensitive field preserved
        expect(row.response_payload.data).toBe(
          (params.responsePayload as Record<string, unknown>).data,
        );
      }),
      { numRuns: 100 },
    );
  });
});
