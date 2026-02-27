import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitBooking } from '../lifecycleApiClient';
import type { AdaptedBookingRequest } from '../bookingAdapter';

const mockPayload: AdaptedBookingRequest = {
  bookingReferenceId: 'booking-test-123',
  recipientName: 'Test User',
  recipientPhone: '+911234567890',
  originAddress: '123 Origin St, City, State - 110001',
  destinationAddress: '456 Dest St, Dubai, UAE - 00000',
  destinationCountry: 'UAE',
  weightKg: 1.5,
  declaredValue: 500,
  shipmentType: 'medicine',
  shippingCost: 1500,
  gstAmount: 270,
  totalAmount: 1770,
};

const mockToken = 'test-auth-token';

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    json: () => Promise.resolve(body),
  });
}

describe('submitBooking', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST with correct headers and body', async () => {
    const fetchSpy = mockFetchResponse(201, { success: true, shipment: { id: 's1' } });
    vi.stubGlobal('fetch', fetchSpy);

    await submitBooking(mockPayload, mockToken);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/shipments/book');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['Authorization']).toBe(`Bearer ${mockToken}`);
    expect(JSON.parse(options.body)).toEqual(mockPayload);
  });

  it('returns httpStatus 201 and parsed body on success', async () => {
    const responseBody = {
      success: true,
      shipment: {
        id: 'shipment-abc',
        user_id: 'user-1',
        current_leg: 'domestic',
        current_status: 'BOOKING_CONFIRMED',
        domestic_awb: 'AWB123',
        booking_reference_id: 'booking-test-123',
        origin_address: '123 Origin St',
        destination_address: '456 Dest St',
        destination_country: 'UAE',
        recipient_name: 'Test User',
        recipient_phone: '+911234567890',
        weight_kg: 1.5,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    };
    vi.stubGlobal('fetch', mockFetchResponse(201, responseBody));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(201);
    expect(result.body.success).toBe(true);
    expect(result.body.shipment?.id).toBe('shipment-abc');
    expect(result.body.shipment?.domestic_awb).toBe('AWB123');
  });

  it('returns httpStatus 400 with validation error details', async () => {
    const responseBody = {
      success: false,
      error: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: [
        { field: 'recipientPhone', message: 'Invalid phone number format' },
        { field: 'weightKg', message: 'Must be positive' },
      ],
    };
    vi.stubGlobal('fetch', mockFetchResponse(400, responseBody));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.errorCode).toBe('VALIDATION_ERROR');
    expect(result.body.details).toHaveLength(2);
    expect(result.body.details![0].field).toBe('recipientPhone');
  });

  it('returns httpStatus 401 for unauthorized requests', async () => {
    const responseBody = {
      success: false,
      error: 'Unauthorized',
    };
    vi.stubGlobal('fetch', mockFetchResponse(401, responseBody));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(401);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toBe('Unauthorized');
  });

  it('returns httpStatus 429 for rate-limited requests', async () => {
    const responseBody = {
      success: false,
      error: 'Too many requests',
      errorCode: 'RATE_LIMITED',
    };
    vi.stubGlobal('fetch', mockFetchResponse(429, responseBody));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(429);
    expect(result.body.success).toBe(false);
    expect(result.body.errorCode).toBe('RATE_LIMITED');
  });

  it('returns httpStatus 502 when Nimbus API is unavailable', async () => {
    const responseBody = {
      success: false,
      error: 'Courier service unavailable',
      errorCode: 'NIMBUS_API_FAILURE',
    };
    vi.stubGlobal('fetch', mockFetchResponse(502, responseBody));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(502);
    expect(result.body.success).toBe(false);
    expect(result.body.errorCode).toBe('NIMBUS_API_FAILURE');
  });

  it('returns httpStatus 0 with connectivity error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(0);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toBe('Unable to connect. Please check your internet connection.');
    expect(result.body.shipment).toBeUndefined();
  });

  it('returns httpStatus 0 on DNS resolution failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')));

    const result = await submitBooking(mockPayload, mockToken);

    expect(result.httpStatus).toBe(0);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain('Unable to connect');
  });
});
