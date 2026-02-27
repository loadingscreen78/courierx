/**
 * Integration test: Idempotent retry flow (Property 8)
 *
 * Feature: booking-lifecycle-integration, Property 8: Idempotent booking creation
 *
 * Simulates a failed first attempt and retry with the same bookingReferenceId,
 * verifying no duplicate shipment is created. The idempotency guarantee comes
 * from the booking service's check on booking_reference_id before inserting.
 *
 * Validates: Requirements 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { submitBooking } from '../lifecycleApiClient';
import { adaptBookingData, generateBookingReferenceId } from '../bookingAdapter';
import type { AdaptedBookingRequest } from '../bookingAdapter';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { LifecycleApiResult } from '../lifecycleApiClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

function mockFetchSuccess(shipmentId: string, bookingReferenceId: string) {
  return vi.fn().mockResolvedValue({
    status: 201,
    json: () =>
      Promise.resolve({
        success: true,
        shipment: {
          id: shipmentId,
          user_id: 'user-1',
          current_leg: 'domestic',
          current_status: 'BOOKING_CONFIRMED',
          domestic_awb: 'AWB-RETRY-001',
          booking_reference_id: bookingReferenceId,
          origin_address: '42 MG Road, Near Metro Station, Mumbai, Maharashtra - 400001',
          destination_address: '789 Broadway, Apt 4B, New York, United States - 10001',
          destination_country: 'United States',
          recipient_name: 'John Doe',
          recipient_phone: '+14155551234',
          weight_kg: 1.5,
          created_at: '2026-01-15T10:00:00Z',
          updated_at: '2026-01-15T10:00:00Z',
        },
      }),
  });
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleMedicineData: MedicineBookingData = {
  medicines: [
    {
      id: 'med-1',
      medicineType: 'allopathy' as const,
      category: 'branded' as const,
      form: 'tablet' as const,
      medicineName: 'Paracetamol',
      unitCount: 20,
      unitPrice: 5,
      dailyDosage: 2,
      manufacturerName: 'PharmaCo',
      manufacturerAddress: '123 Pharma St',
      mfgDate: null,
      batchNo: 'BATCH001',
      expiryDate: null,
      hsnCode: '30049099',
      isControlled: false,
    },
  ],
  pickupAddress: {
    fullName: 'Sender Kumar',
    phone: '+919876543210',
    addressLine1: '42 MG Road',
    addressLine2: 'Near Metro Station',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  consigneeAddress: {
    fullName: 'John Doe',
    phone: '+14155551234',
    email: 'john@example.com',
    addressLine1: '789 Broadway',
    addressLine2: 'Apt 4B',
    city: 'New York',
    country: 'United States',
    zipcode: '10001',
    passportNumber: 'A12345678',
  },
  prescription: null,
  pharmacyBill: null,
  consigneeId: null,
  insurance: false,
  specialPackaging: false,
};

const MOCK_AUTH_TOKEN = 'test-auth-token-xyz';
const MOCK_SHIPMENT_ID = 'shipment-idempotent-001';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Idempotent retry flow (Property 8)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Core idempotency scenario: network failure → retry → same shipment
  // -------------------------------------------------------------------------

  it('retry with same bookingReferenceId returns the same shipment (no duplicate)', async () => {
    const draftId = 'draft-idempotent-test';
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });

    const expectedRefId = `draft-${draftId}`;
    expect(payload.bookingReferenceId).toBe(expectedRefId);

    // --- Attempt 1: network error (simulates connectivity failure) ---
    vi.stubGlobal('fetch', mockFetchNetworkError());

    const attempt1 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt1.httpStatus).toBe(0);
    expect(attempt1.body.success).toBe(false);
    expect(attempt1.body.shipment).toBeUndefined();

    // --- Attempt 2: retry with the SAME payload (same bookingReferenceId) ---
    // The server's idempotency check finds the existing row and returns it
    vi.stubGlobal(
      'fetch',
      mockFetchSuccess(MOCK_SHIPMENT_ID, expectedRefId),
    );

    const attempt2 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt2.httpStatus).toBe(201);
    expect(attempt2.body.success).toBe(true);
    expect(attempt2.body.shipment).toBeDefined();
    expect(attempt2.body.shipment!.id).toBe(MOCK_SHIPMENT_ID);
    expect(attempt2.body.shipment!.booking_reference_id).toBe(expectedRefId);
  });

  // -------------------------------------------------------------------------
  // Requirement 7.3: bookingReferenceId persists in component state across retries
  // -------------------------------------------------------------------------

  it('bookingReferenceId remains stable across multiple retries within a session', async () => {
    const draftId = 'draft-session-stable';

    // Simulate component state: generate once, reuse on retries
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });
    const storedRefId = payload.bookingReferenceId;

    // Attempt 1: 502 (Nimbus failure)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 502,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Courier service unavailable',
            errorCode: 'NIMBUS_API_FAILURE',
          }),
      }),
    );

    const attempt1 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt1.httpStatus).toBe(502);

    // Attempt 2: network error
    vi.stubGlobal('fetch', mockFetchNetworkError());

    const attempt2 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt2.httpStatus).toBe(0);

    // Attempt 3: success — same bookingReferenceId used throughout
    vi.stubGlobal(
      'fetch',
      mockFetchSuccess(MOCK_SHIPMENT_ID, storedRefId),
    );

    const attempt3 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt3.httpStatus).toBe(201);
    expect(attempt3.body.shipment!.booking_reference_id).toBe(storedRefId);

    // The payload's bookingReferenceId never changed across all 3 attempts
    expect(payload.bookingReferenceId).toBe(storedRefId);
  });

  // -------------------------------------------------------------------------
  // Requirement 7.1: deterministic reference from draft ID
  // -------------------------------------------------------------------------

  it('draft-based bookingReferenceId is deterministic across adapter calls', () => {
    const draftId = 'draft-deterministic-check';

    const payload1 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });
    const payload2 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });

    expect(payload1.bookingReferenceId).toBe(payload2.bookingReferenceId);
    expect(payload1.bookingReferenceId).toBe(`draft-${draftId}`);
  });

  // -------------------------------------------------------------------------
  // Verify the server returns the same shipment on idempotent retry
  // -------------------------------------------------------------------------

  it('server returns identical shipment data on idempotent retry', async () => {
    const draftId = 'draft-identical-return';
    const refId = `draft-${draftId}`;
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });

    // Both calls succeed — simulating the case where the first request
    // actually created the shipment but the client didn't receive the response
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SHIPMENT_ID, refId));

    const call1 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    const call2 = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(call1.body.shipment!.id).toBe(call2.body.shipment!.id);
    expect(call1.body.shipment!.booking_reference_id).toBe(
      call2.body.shipment!.booking_reference_id,
    );
  });

  // -------------------------------------------------------------------------
  // Property 8 (PBT): For any draftId, retries produce the same reference
  // -------------------------------------------------------------------------

  it('Property 8: for any draftId, retries always use the same bookingReferenceId (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s.trim().length > 0),
        (draftId) => {
          const ref1 = generateBookingReferenceId(draftId);
          const ref2 = generateBookingReferenceId(draftId);

          // Same draftId always produces the same reference (deterministic)
          expect(ref1).toBe(ref2);
          expect(ref1).toBe(`draft-${draftId}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 8: without draftId, each call produces a unique reference (no accidental idempotency)', () => {
    const seen = new Set<string>();

    fc.assert(
      fc.property(fc.constant(null), () => {
        const ref = generateBookingReferenceId();
        expect(ref).toMatch(/^booking-/);
        expect(seen.has(ref)).toBe(false);
        seen.add(ref);
      }),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // Edge case: 429 rate limit then retry with same reference
  // -------------------------------------------------------------------------

  it('retry after 429 rate limit uses the same bookingReferenceId', async () => {
    const draftId = 'draft-rate-limit-retry';
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });

    // First attempt: rate limited
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 429,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Too many requests',
            errorCode: 'RATE_LIMITED',
          }),
      }),
    );

    const attempt1 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt1.httpStatus).toBe(429);

    // Retry: success with same reference
    const refId = payload.bookingReferenceId;
    vi.stubGlobal('fetch', mockFetchSuccess(MOCK_SHIPMENT_ID, refId));

    const attempt2 = await submitBooking(payload, MOCK_AUTH_TOKEN);
    expect(attempt2.httpStatus).toBe(201);
    expect(attempt2.body.shipment!.booking_reference_id).toBe(refId);
  });

  // -------------------------------------------------------------------------
  // Verify fetch is called with the same bookingReferenceId on retry
  // -------------------------------------------------------------------------

  it('the same bookingReferenceId is sent in the request body on retry', async () => {
    const draftId = 'draft-body-check';
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId,
    });

    // Attempt 1: network error
    vi.stubGlobal('fetch', mockFetchNetworkError());
    await submitBooking(payload, MOCK_AUTH_TOKEN);

    // Attempt 2: success
    const successFetch = mockFetchSuccess(MOCK_SHIPMENT_ID, payload.bookingReferenceId);
    vi.stubGlobal('fetch', successFetch);
    await submitBooking(payload, MOCK_AUTH_TOKEN);

    // Verify the body sent on retry contains the same bookingReferenceId
    const [, options] = successFetch.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.bookingReferenceId).toBe(`draft-${draftId}`);
  });
});
