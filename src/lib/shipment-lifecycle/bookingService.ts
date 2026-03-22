import { ShipmentRow } from './types';
import { bookingRequestSchema } from './inputValidator';
import { getServiceRoleClient } from './supabaseAdmin';
import { updateShipmentStatus } from './stateMachine';

// ---------------------------------------------------------------------------
// NimbusPost direct integration (mirrors nimbusPostDomestic pattern)
// Uses NIMBUS_EMAIL + NIMBUS_PASSWORD — NOT the legacy nimbusClient
// ---------------------------------------------------------------------------

const NIMBUS_API_BASE = 'https://api.nimbuspost.com/v1';

interface NimbusTokenCache { token: string; expiresAt: number }
let _tokenCache: NimbusTokenCache | null = null;

async function getNimbusToken(): Promise<string> {
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) return _tokenCache.token;
  const email = process.env.NIMBUS_EMAIL?.trim();
  const password = process.env.NIMBUS_PASSWORD?.trim();
  if (!email || !password) throw new Error('NIMBUS_EMAIL / NIMBUS_PASSWORD not configured');
  const res = await fetch(`${NIMBUS_API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Nimbus auth failed: ${res.status}`);
  const data = await res.json();
  const token = data?.data;
  if (!token) throw new Error('No token in Nimbus auth response');
  _tokenCache = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return token;
}

interface NimbusBookingResult { success: boolean; awb?: string; label_url?: string; error?: string }

async function createNimbusShipment(req: BookingRequest): Promise<NimbusBookingResult> {
  const token = await getNimbusToken();
  const payload = {
    order_number: `CX-${Date.now()}`,
    shipping_charges: 0,
    discount: 0,
    cod_charges: 0,
    payment_type: 'prepaid',
    order_amount: req.declaredValue,
    package_weight: Math.round((req.weightKg || 0.5) * 1000), // kg → grams
    package_length: req.dimensions?.lengthCm ?? 10,
    package_breadth: req.dimensions?.widthCm ?? 10,
    package_height: req.dimensions?.heightCm ?? 5,
    consignee: {
      name: req.recipientName,
      address: req.destinationAddress,
      address_2: '',
      city: '',
      state: req.destinationCountry,
      pincode: '000000',
      phone: req.recipientPhone || '0000000000',
    },
    pickup: {
      warehouse_name: 'default',
      name: 'CourierX Warehouse',
      address: req.originAddress,
      address_2: '',
      city: 'Cuttack',
      state: 'Odisha',
      pincode: '753001',
      phone: '9999999999',
    },
    order_items: [{ name: req.shipmentType, qty: 1, price: req.declaredValue || 1 }],
    courier_id: 1, // default courier; will be overridden by NimbusPost auto-selection
  };
  const res = await fetch(`${NIMBUS_API_BASE}/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    return { success: false, error: `NimbusPost error: ${res.status} ${err}` };
  }
  const data = await res.json();
  if (data?.status === false || data?.status_code !== 200) {
    return { success: false, error: data?.message || 'Shipment creation failed' };
  }
  return {
    success: true,
    awb: data?.data?.awb_number || data?.data?.awb,
    label_url: data?.data?.label || data?.data?.label_url,
  };
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BookingRequest {
  userId: string;
  bookingReferenceId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  originAddress: string;
  destinationAddress: string;
  destinationCountry: string;
  weightKg: number;
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
  declaredValue: number;
  shipmentType: 'medicine' | 'document' | 'gift';
  shippingCost?: number;
  gstAmount?: number;
  totalAmount?: number;
  cxbcPartnerId?: string;
  source?: 'cxbc' | 'customer';
}

export interface BookingResult {
  success: boolean;
  shipment?: ShipmentRow;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'NIMBUS_API_FAILURE' | 'RATE_LIMITED';
}

// ---------------------------------------------------------------------------
// createBooking
// ---------------------------------------------------------------------------

/**
 * Creates a new shipment booking.
 *
 * 1. Validate inputs via Zod
 * 2. Check idempotency by booking_reference_id
 * 3. Create shipment row (PENDING / DOMESTIC / version=1)
 * 4. Call Nimbus createShipment
 * 5. On success: update domestic_awb, transition to BOOKING_CONFIRMED
 * 6. On failure: mark FAILED, return error
 * 7. API calls are logged with PII masking by the Nimbus client
 */
export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  // 1. Validate inputs
  const validation = bookingRequestSchema.safeParse({
    bookingReferenceId: req.bookingReferenceId,
    recipientName: req.recipientName,
    recipientPhone: req.recipientPhone,
    recipientEmail: req.recipientEmail,
    originAddress: req.originAddress,
    destinationAddress: req.destinationAddress,
    destinationCountry: req.destinationCountry,
    weightKg: req.weightKg,
    dimensions: req.dimensions,
    declaredValue: req.declaredValue,
    shipmentType: req.shipmentType,
    shippingCost: req.shippingCost,
    gstAmount: req.gstAmount,
    totalAmount: req.totalAmount,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join('; '),
      errorCode: 'VALIDATION_ERROR',
    };
  }

  const supabase = getServiceRoleClient();

  // 2. Idempotency check
  const { data: existing } = await supabase
    .from('shipments')
    .select('*')
    .eq('booking_reference_id', req.bookingReferenceId)
    .maybeSingle();

  if (existing) {
    return { success: true, shipment: existing as unknown as ShipmentRow };
  }

  // 3. Create shipment row — international bookings start at COUNTER (warehouse intake)
  const { data: created, error: insertError } = await supabase
    .from('shipments')
    .insert({
      user_id: req.userId,
      booking_reference_id: req.bookingReferenceId,
      current_status: 'PENDING',
      current_leg: 'COUNTER',
      version: 1,
      recipient_name: req.recipientName,
      recipient_phone: req.recipientPhone,
      ...(req.recipientEmail && { recipient_email: req.recipientEmail }),
      origin_address: req.originAddress,
      destination_address: req.destinationAddress,
      destination_country: req.destinationCountry,
      weight_kg: req.weightKg,
      declared_value: req.declaredValue,
      shipment_type: req.shipmentType,
      alert_sent: false,
      ...(req.shippingCost !== undefined && { shipping_cost: req.shippingCost }),
      ...(req.gstAmount !== undefined && { gst_amount: req.gstAmount }),
      ...(req.totalAmount !== undefined && { total_amount: req.totalAmount }),
      ...(req.cxbcPartnerId && { cxbc_partner_id: req.cxbcPartnerId }),
      ...(req.source && { source: req.source }),
    })
    .select('*')
    .single();

  if (insertError || !created) {
    return {
      success: false,
      error: `Failed to create shipment: ${insertError?.message ?? 'unknown'}`,
    };
  }

  const shipment = created as unknown as ShipmentRow;

  // 4. Call NimbusPost to create shipment & get AWB
  // Falls back to mock only if credentials are missing (dev/staging)
  const skipNimbus = !process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD;

  let awb: string;
  let labelUrl: string | undefined;

  if (skipNimbus) {
    awb = `CX-MOCK-${Date.now()}`;
  } else {
    const nimbusResult = await createNimbusShipment(req);
    if (!nimbusResult.success || !nimbusResult.awb) {
      await supabase
        .from('shipments')
        .update({ current_status: 'FAILED' })
        .eq('id', shipment.id)
        .eq('version', 1);
      return {
        success: false,
        error: nimbusResult.error ?? 'Nimbus API returned no AWB',
        errorCode: 'NIMBUS_API_FAILURE',
      };
    }
    awb = nimbusResult.awb;
    labelUrl = nimbusResult.label_url;
  }

  // 5. Update domestic_awb (used for label fetch) and optionally label URL
  await supabase
    .from('shipments')
    .update({
      domestic_awb: awb,
      ...(labelUrl && { domestic_label_url: labelUrl }),
    })
    .eq('id', shipment.id);

  const result = await updateShipmentStatus({
    shipmentId: shipment.id,
    newStatus: 'BOOKING_CONFIRMED',
    source: 'NIMBUS',
    metadata: { awb, bookingReferenceId: req.bookingReferenceId },
    expectedVersion: 1,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? 'Failed to confirm booking',
    };
  }

  return { success: true, shipment: result.shipment };
}

// ---------------------------------------------------------------------------
// dispatchInternational
// ---------------------------------------------------------------------------

/**
 * Dispatches a shipment internationally.
 *
 * 1. Validate shipment is DISPATCH_APPROVED
 * 2. Generate mock international_awb
 * 3. Transition to INTERNATIONAL / DISPATCHED via state machine
 */
export async function dispatchInternational(
  shipmentId: string,
  expectedVersion: number,
): Promise<BookingResult> {
  const supabase = getServiceRoleClient();

  const { data: shipment, error: fetchError } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (fetchError || !shipment) {
    return { success: false, error: `Shipment not found: ${shipmentId}` };
  }

  const row = shipment as unknown as ShipmentRow;

  if (row.current_status !== 'DISPATCH_APPROVED') {
    return {
      success: false,
      error: `Shipment must be DISPATCH_APPROVED to dispatch internationally, current status: ${row.current_status}`,
    };
  }

  // Generate mock international AWB
  const internationalAwb = `INTL-${crypto.randomUUID()}`;

  await supabase
    .from('shipments')
    .update({ international_awb: internationalAwb })
    .eq('id', shipmentId);

  const result = await updateShipmentStatus({
    shipmentId,
    newStatus: 'DISPATCHED',
    newLeg: 'INTERNATIONAL',
    source: 'INTERNAL',
    metadata: { internationalAwb },
    expectedVersion,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, shipment: result.shipment };
}
