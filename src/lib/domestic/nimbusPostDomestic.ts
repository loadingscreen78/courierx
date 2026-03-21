/**
 * Server-only NimbusPost domestic API client.
 * Handles rate checking and shipment creation for domestic (India-to-India) shipments.
 *
 * Uses the same NIMBUS_* env vars as the international client.
 * MUST NOT be imported from client-side code.
 */

import { MARKUP_MULTIPLIER } from './types';
import type { CourierOption, CourierMode, RateCheckRequest } from './types';

const NIMBUS_API_BASE = 'https://api.nimbuspost.com/v1';

// ---------------------------------------------------------------------------
// Auth — reuse token caching pattern
// ---------------------------------------------------------------------------

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function authenticate(): Promise<string> {
  const email = process.env.NIMBUS_EMAIL;
  const password = process.env.NIMBUS_PASSWORD;

  if (!email || !password) {
    throw new Error('[nimbusPostDomestic] NIMBUS_EMAIL / NIMBUS_PASSWORD not set');
  }

  const res = await fetch(`${NIMBUS_API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`[nimbusPostDomestic] Auth failed: ${res.status}`);
  }

  const data = await res.json();
  const token = data?.data;

  if (!token) {
    throw new Error('[nimbusPostDomestic] No token in auth response');
  }

  // Cache for 23 hours
  tokenCache = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  return authenticate();
}

// ---------------------------------------------------------------------------
// Rate Check — fetch available couriers for a domestic route
// ---------------------------------------------------------------------------

export async function fetchDomesticRates(req: RateCheckRequest): Promise<CourierOption[]> {
  const token = await getToken();

  const payload = {
    origin: req.pickupPincode,
    destination: req.deliveryPincode,
    payment_type: 'prepaid',
    order_amount: req.declaredValue,
    weight: req.weightKg,
    length: req.lengthCm,
    breadth: req.widthCm,
    height: req.heightCm,
  };

  const res = await fetch(`${NIMBUS_API_BASE}/courier/serviceability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // If 401, clear cache and retry once
    if (res.status === 401) {
      tokenCache = null;
      const newToken = await authenticate();
      const retryRes = await fetch(`${NIMBUS_API_BASE}/courier/serviceability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retryRes.ok) {
        throw new Error(`NimbusPost rate check failed: ${retryRes.status}`);
      }
      const retryData = await retryRes.json();
      return mapCourierResponse(retryData);
    }
    throw new Error(`NimbusPost rate check failed: ${res.status}`);
  }

  const data = await res.json();
  return mapCourierResponse(data);
}

function mapCourierResponse(data: any): CourierOption[] {
  const couriers = data?.data?.available_couriers || data?.data || [];

  if (!Array.isArray(couriers) || couriers.length === 0) {
    return [];
  }

  // Sort by freight charge ascending
  const sorted = couriers
    .filter((c: any) => c.freight_charge > 0)
    .sort((a: any, b: any) => a.freight_charge - b.freight_charge);

  return sorted.map((c: any, idx: number) => {
    const shippingCharge = Math.round(c.freight_charge * MARKUP_MULTIPLIER);
    const gstAmount = Math.round(shippingCharge * 0.18);
    const customerPrice = shippingCharge + gstAmount;

    // NimbusPost mode: 0 = surface, 1 = air/express
    const mode: CourierMode = c.mode === 1 ? 'air' : 'surface';

    return {
      courier_company_id: c.courier_company_id,
      courier_name: c.courier_name || 'Unknown Courier',
      freight_charge: Math.round(c.freight_charge),
      shipping_charge: shippingCharge,
      gst_amount: gstAmount,
      customer_price: customerPrice,
      estimated_delivery_days: c.estimated_delivery_days || c.etd_days || 3,
      etd: c.etd || '',
      rating: c.rating || 0,
      rto_charges: Math.round((c.rto_charges || 0) * MARKUP_MULTIPLIER),
      cod: !!c.cod,
      cod_charges: Math.round((c.cod_charges || 0) * MARKUP_MULTIPLIER),
      pickup_availability: c.pickup_availability !== false,
      is_recommended: idx === 0, // cheapest = recommended
      mode,
    };
  });
}

// ---------------------------------------------------------------------------
// Create Domestic Shipment — book with NimbusPost and get AWB
// ---------------------------------------------------------------------------

export interface CreateDomesticShipmentParams {
  courier_id: number;
  pickup: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  delivery: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  order_amount: number;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  payment_type: 'prepaid';
  content_description: string;
}

export interface CreateDomesticShipmentResponse {
  success: boolean;
  awb?: string;
  order_id?: string;
  label_url?: string;
  error?: string;
}

export async function createDomesticShipment(
  params: CreateDomesticShipmentParams,
): Promise<CreateDomesticShipmentResponse> {
  const token = await getToken();

  const payload = {
    order_number: `CXD-${Date.now()}`,
    shipping_charges: 0,
    discount: 0,
    cod_charges: 0,
    payment_type: params.payment_type,
    order_amount: params.order_amount,
    package_weight: params.weight,
    package_length: params.length,
    package_breadth: params.breadth,
    package_height: params.height,
    consignee: {
      name: params.delivery.name,
      address: params.delivery.address,
      address_2: '',
      city: params.delivery.city,
      state: params.delivery.state,
      pincode: params.delivery.pincode,
      phone: params.delivery.phone,
    },
    pickup: {
      warehouse_name: 'default',
      name: params.pickup.name,
      address: params.pickup.address,
      address_2: '',
      city: params.pickup.city,
      state: params.pickup.state,
      pincode: params.pickup.pincode,
      phone: params.pickup.phone,
    },
    order_items: [
      {
        name: params.content_description || 'Domestic Shipment',
        qty: 1,
        price: params.order_amount,
      },
    ],
    courier_id: params.courier_id,
  };

  const res = await fetch(`${NIMBUS_API_BASE}/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[nimbusPostDomestic] Create shipment failed:', res.status, errBody);
    return { success: false, error: `NimbusPost shipment creation failed: ${res.status}` };
  }

  const data = await res.json();

  if (data?.status === false || data?.status_code !== 200) {
    return { success: false, error: data?.message || 'Shipment creation failed' };
  }

  const shipmentData = data?.data;

  return {
    success: true,
    awb: shipmentData?.awb_number || shipmentData?.awb,
    order_id: shipmentData?.order_id?.toString(),
    label_url: shipmentData?.label || shipmentData?.label_url,
  };
}
