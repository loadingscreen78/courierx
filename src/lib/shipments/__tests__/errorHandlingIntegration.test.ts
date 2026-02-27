/**
 * Integration test: Error handling across all HTTP status codes
 *
 * Verifies that the lifecycle API client + booking form error handling logic
 * produces the correct user-facing behavior for each error scenario.
 *
 * All three booking forms (Medicine, Document, Gift) share the same error
 * handling pattern. This test validates the shared behavior by exercising
 * the submitBooking client against mocked fetch responses and verifying
 * the resulting actions (redirect, toast messages).
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitBooking } from '../lifecycleApiClient';
import { adaptBookingData } from '../bookingAdapter';
import type { AdaptedBookingRequest } from '../bookingAdapter';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { LifecycleApiResult } from '../lifecycleApiClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    json: () => Promise.resolve(body),
  });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

/**
 * Replicates the error-handling logic shared by all three booking forms.
 * Returns a description of the user-facing action taken.
 */
function handleApiResult(result: LifecycleApiResult): {
  action: 'redirect' | 'toast' | 'success';
  redirectTo?: string;
  toastType?: 'error' | 'warning';
  toastTitle?: string;
  toastDescription?: string;
} {
  const { httpStatus, body } = result;

  if (httpStatus === 401) {
    return {
      action: 'redirect',
      redirectTo: '/auth',
      toastType: 'error',
      toastTitle: 'Session expired. Please sign in again.',
    };
  }
  if (httpStatus === 429) {
    return {
      action: 'toast',
      toastType: 'error',
      toastTitle: 'Too many requests',
      toastDescription: 'Please wait a moment before trying again.',
    };
  }
  if (httpStatus === 502) {
    return {
      action: 'toast',
      toastType: 'error',
      toastTitle: 'Courier Unavailable',
      toastDescription: 'Courier service is temporarily unavailable. Please try again later.',
    };
  }
  if (httpStatus === 400) {
    const detail = body.details?.map((d: { field: string; message: string }) =>
      `${d.field}: ${d.message}`
    ).join(', ') || body.error;
    return {
      action: 'toast',
      toastType: 'error',
      toastTitle: 'Validation Error',
      toastDescription: detail || 'Invalid booking data.',
    };
  }
  if (httpStatus === 0) {
    return {
      action: 'toast',
      toastType: 'error',
      toastTitle: 'Connection Error',
      toastDescription: body.error || 'Unable to connect. Please check your internet connection.',
    };
  }
  if (!body.success || !body.shipment) {
    return {
      action: 'toast',
      toastType: 'error',
      toastTitle: 'Booking Failed',
      toastDescription: body.error || 'Failed to create shipment. Please try again.',
    };
  }

  return { action: 'success' };
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

let payload: AdaptedBookingRequest;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Error handling integration across all HTTP status codes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: 'draft-err-test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Requirement 6.1: HTTP 401 → redirect to /auth
  it('HTTP 401 triggers redirect to /auth page', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(401, {
      success: false,
      error: 'Unauthorized',
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(401);
    expect(result.body.success).toBe(false);

    const handling = handleApiResult(result);
    expect(handling.action).toBe('redirect');
    expect(handling.redirectTo).toBe('/auth');
  });

  // Requirement 6.2: HTTP 429 → rate limit toast
  it('HTTP 429 shows rate limit toast instructing user to wait', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(429, {
      success: false,
      error: 'Too many requests',
      errorCode: 'RATE_LIMITED',
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(429);
    expect(result.body.errorCode).toBe('RATE_LIMITED');

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Too many requests');
    expect(handling.toastDescription).toContain('wait a moment');
  });

  // Requirement 6.3: HTTP 502 → courier unavailable toast
  it('HTTP 502 shows courier service unavailable toast', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(502, {
      success: false,
      error: 'Courier service unavailable',
      errorCode: 'NIMBUS_API_FAILURE',
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(502);
    expect(result.body.errorCode).toBe('NIMBUS_API_FAILURE');

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Courier Unavailable');
    expect(handling.toastDescription).toContain('temporarily unavailable');
  });

  // Requirement 6.4: HTTP 400 → validation error details
  it('HTTP 400 shows specific validation error details from response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(400, {
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: [
        { field: 'recipientPhone', message: 'Invalid phone number format' },
        { field: 'weightKg', message: 'Must be a positive number' },
      ],
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(400);
    expect(result.body.details).toHaveLength(2);

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Validation Error');
    expect(handling.toastDescription).toContain('recipientPhone');
    expect(handling.toastDescription).toContain('Invalid phone number format');
    expect(handling.toastDescription).toContain('weightKg');
    expect(handling.toastDescription).toContain('Must be a positive number');
  });

  // Requirement 6.4 (edge case): HTTP 400 without details array falls back to error message
  it('HTTP 400 without details array falls back to error message', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(400, {
      success: false,
      error: 'Missing required fields',
      errorCode: 'VALIDATION_ERROR',
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(400);

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Validation Error');
    expect(handling.toastDescription).toBe('Missing required fields');
  });

  // Requirement 6.5: Network error → connectivity error message
  it('network error shows connectivity error toast', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(0);
    expect(result.body.success).toBe(false);

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Connection Error');
    expect(handling.toastDescription).toContain('Unable to connect');
    expect(handling.toastDescription).toContain('internet connection');
  });

  // Verify that error responses do NOT contain a shipment object
  it('all error responses have no shipment object', async () => {
    const errorScenarios = [
      { status: 401, body: { success: false, error: 'Unauthorized' } },
      { status: 429, body: { success: false, error: 'Rate limited', errorCode: 'RATE_LIMITED' } },
      { status: 502, body: { success: false, error: 'Nimbus down', errorCode: 'NIMBUS_API_FAILURE' } },
      { status: 400, body: { success: false, error: 'Bad request', errorCode: 'VALIDATION_ERROR' } },
    ];

    for (const scenario of errorScenarios) {
      vi.stubGlobal('fetch', mockFetchResponse(scenario.status, scenario.body));
      const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

      expect(result.body.success).toBe(false);
      expect(result.body.shipment).toBeUndefined();
      vi.restoreAllMocks();
    }
  });

  // Verify network error also has no shipment
  it('network error response has no shipment object', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());
    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.body.success).toBe(false);
    expect(result.body.shipment).toBeUndefined();
  });

  // Verify that only 401 triggers a redirect, all others show toasts
  it('only HTTP 401 triggers redirect; other errors show toasts', async () => {
    const toastStatuses = [
      { status: 429, body: { success: false, errorCode: 'RATE_LIMITED' } },
      { status: 502, body: { success: false, errorCode: 'NIMBUS_API_FAILURE' } },
      { status: 400, body: { success: false, error: 'Bad request' } },
    ];

    for (const scenario of toastStatuses) {
      vi.stubGlobal('fetch', mockFetchResponse(scenario.status, scenario.body));
      const result = await submitBooking(payload, MOCK_AUTH_TOKEN);
      const handling = handleApiResult(result);

      expect(handling.action).toBe('toast');
      expect(handling.redirectTo).toBeUndefined();
      vi.restoreAllMocks();
    }

    // Network error also shows toast, not redirect
    vi.stubGlobal('fetch', mockFetchNetworkError());
    const networkResult = await submitBooking(payload, MOCK_AUTH_TOKEN);
    const networkHandling = handleApiResult(networkResult);
    expect(networkHandling.action).toBe('toast');
    expect(networkHandling.redirectTo).toBeUndefined();
  });

  // Verify HTTP 500 generic error handling
  it('HTTP 500 shows generic error toast', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(500, {
      success: false,
      error: 'Internal server error',
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(500);
    expect(result.body.success).toBe(false);

    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Booking Failed');
  });

  // Verify the adapter payload is correctly formed before any API call
  it('adapter produces valid payload that is sent to the API', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(401, { success: false, error: 'Unauthorized' }));

    await submitBooking(payload, MOCK_AUTH_TOKEN);

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [url, options] = fetchCall;

    expect(url).toBe('/api/shipments/book');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe(`Bearer ${MOCK_AUTH_TOKEN}`);

    const sentBody = JSON.parse(options.body);
    expect(sentBody.recipientName).toBe('John Doe');
    expect(sentBody.shipmentType).toBe('medicine');
    expect(sentBody.bookingReferenceId).toBe('draft-draft-err-test');
  });

  // Verify DNS resolution failure is treated as network error
  it('DNS resolution failure is treated as network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    expect(result.httpStatus).toBe(0);
    const handling = handleApiResult(result);
    expect(handling.action).toBe('toast');
    expect(handling.toastTitle).toBe('Connection Error');
    expect(handling.toastDescription).toContain('Unable to connect');
  });

  // Verify HTTP 400 with single validation error detail
  it('HTTP 400 with single validation error shows that field detail', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(400, {
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: [
        { field: 'destinationCountry', message: 'Country not supported' },
      ],
    }));

    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);
    const handling = handleApiResult(result);

    expect(handling.toastDescription).toBe('destinationCountry: Country not supported');
  });
});
