import type { AdaptedBookingRequest } from './bookingAdapter';

export interface LifecycleApiResponse {
  success: boolean;
  shipment?: {
    id: string;
    user_id: string;
    current_leg: string;
    current_status: string;
    domestic_awb: string | null;
    booking_reference_id: string | null;
    origin_address: string;
    destination_address: string;
    destination_country: string;
    recipient_name: string;
    recipient_phone: string | null;
    weight_kg: number | null;
    created_at: string;
    updated_at: string;
  };
  error?: string;
  errorCode?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface LifecycleApiResult {
  httpStatus: number;
  body: LifecycleApiResponse;
}

export async function submitBooking(
  payload: AdaptedBookingRequest,
  authToken: string,
): Promise<LifecycleApiResult> {
  try {
    const response = await fetch('/api/shipments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body: LifecycleApiResponse = await response.json();

    return { httpStatus: response.status, body };
  } catch {
    return {
      httpStatus: 0,
      body: {
        success: false,
        error: 'Unable to connect. Please check your internet connection.',
      },
    };
  }
}
