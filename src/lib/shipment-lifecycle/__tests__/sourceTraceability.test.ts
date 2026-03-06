import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 8: Source Traceability
 *
 * For any booking submitted with `source: 'cxbc'` and a `cxbcPartnerId`,
 * assert the created shipment has `source = 'cxbc'` and `cxbc_partner_id`
 * matching the submitted partner ID.
 *
 * **Validates: Requirements 11.1**
 */

// ── Mock state ──────────────────────────────────────────────────────────────

let capturedInsertPayload: Record<string, unknown> | null = null;

// ── Supabase mock ───────────────────────────────────────────────────────────

vi.mock('../supabaseAdmin', () => ({
  getServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'shipments') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'not found' },
              }),
            })),
          })),
          insert: vi.fn((payload: Record<string, unknown>) => {
            capturedInsertPayload = { ...payload };
            const row = {
              id: 'generated-uuid',
              ...payload,
              domestic_awb: null,
              international_awb: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: row,
                  error: null,
                }),
              })),
            };
          }),
          update: vi.fn(() => {
            const eqFn = vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                })),
              })),
            }));
            return { eq: eqFn };
          }),
        };
      }
      return {};
    }),
  })),
}));

// ── Nimbus client mock ──────────────────────────────────────────────────────

vi.mock('../nimbusClient', () => ({
  createShipment: vi.fn().mockResolvedValue({
    success: true,
    awb: 'AWB-MOCK-TRACEABILITY',
  }),
}));

// ── State machine mock ──────────────────────────────────────────────────────

vi.mock('../stateMachine', () => ({
  updateShipmentStatus: vi.fn(async ({ shipmentId }: { shipmentId: string }) => {
    return {
      success: true,
      shipment: {
        id: shipmentId,
        current_status: 'BOOKING_CONFIRMED',
        current_leg: 'DOMESTIC',
        version: 2,
        source: capturedInsertPayload?.source,
        cxbc_partner_id: capturedInsertPayload?.cxbc_partner_id,
      },
    };
  }),
}));

// ── Arbitraries ─────────────────────────────────────────────────────────────

const validBookingArb = fc.record({
  bookingReferenceId: fc
    .string({ minLength: 1, maxLength: 64, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w-]/g, 'a') || 'a'),
  recipientName: fc
    .string({ minLength: 1, maxLength: 50, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  recipientPhone: fc.constantFrom(
    '+14155551234',
    '+919876543210',
    '+442071234567',
    '14155551234',
  ),
  originAddress: fc
    .string({ minLength: 1, maxLength: 100, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationAddress: fc
    .string({ minLength: 1, maxLength: 100, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w ]/g, 'a') || 'a'),
  destinationCountry: fc
    .string({ minLength: 2, maxLength: 50, unit: 'grapheme' })
    .map((s) => s.replace(/[^\w]/g, 'ab').slice(0, 50) || 'ab'),
  weightKg: fc.double({ min: 0.01, max: 30, noNaN: true, noDefaultInfinity: true }),
  declaredValue: fc.double({ min: 0.01, max: 999999, noNaN: true, noDefaultInfinity: true }),
  shipmentType: fc.constantFrom('medicine' as const, 'document' as const, 'gift' as const),
});

const userIdArb = fc.uuid();
const cxbcPartnerIdArb = fc.uuid();

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Property 8: Source Traceability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedInsertPayload = null;
  });

  it('insert payload contains source = "cxbc" and cxbc_partner_id matching the submitted partner ID', async () => {
    const { createBooking } = await import('../bookingService');

    await fc.assert(
      fc.asyncProperty(
        validBookingArb,
        userIdArb,
        cxbcPartnerIdArb,
        async (booking, userId, cxbcPartnerId) => {
          capturedInsertPayload = null;

          const result = await createBooking({
            userId,
            ...booking,
            source: 'cxbc',
            cxbcPartnerId,
          });

          expect(result.success).toBe(true);
          expect(capturedInsertPayload).not.toBeNull();

          // Source traceability: insert payload must carry source and partner ID
          expect(capturedInsertPayload!.source).toBe('cxbc');
          expect(capturedInsertPayload!.cxbc_partner_id).toBe(cxbcPartnerId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
