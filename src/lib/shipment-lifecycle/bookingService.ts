import { ShipmentRow } from './types';
import { bookingRequestSchema } from './inputValidator';
import { getServiceRoleClient } from './supabaseAdmin';
import { updateShipmentStatus } from './stateMachine';
import { createDomesticShipment, fetchDomesticRates } from '@/lib/domestic/nimbusPostDomestic';

// ---------------------------------------------------------------------------
// Default warehouse address (fallback if DB not yet seeded)
// ---------------------------------------------------------------------------

const DEFAULT_WAREHOUSE = {
  name: 'CourierX Warehouse',
  phone: '9999999999',
  address: 'Gopalpur',
  city: 'Cuttack',
  state: 'Odisha',
  pincode: '753011',
};

async function getWarehouseAddress(): Promise<typeof DEFAULT_WAREHOUSE> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'warehouse_address')
      .maybeSingle();
    if (data?.value) return data.value as typeof DEFAULT_WAREHOUSE;
  } catch {
    // fall through to default
  }
  return DEFAULT_WAREHOUSE;
}

// ---------------------------------------------------------------------------
// NimbusPost — book domestic leg: customer → warehouse
// ---------------------------------------------------------------------------

async function bookDomesticLegToWarehouse(req: BookingRequest) {
  const warehouse = await getWarehouseAddress();
  const pickup = req.pickupAddress;

  if (!pickup) {
    return { success: false, error: 'No pickup address provided for domestic leg' };
  }

  const pickupPincode = pickup.pincode;
  const pickupAddress1 = `${pickup.addressLine1}${pickup.addressLine2 ? ' ' + pickup.addressLine2 : ''}`;

  // Get best courier via serviceability check
  let courierId = 1;
  try {
    const rates = await fetchDomesticRates({
      pickupPincode,
      deliveryPincode: warehouse.pincode,
      weightKg: req.weightKg || 0.5,
      declaredValue: req.declaredValue || 1,
      lengthCm: req.dimensions?.lengthCm ?? 10,
      widthCm: req.dimensions?.widthCm ?? 10,
      heightCm: req.dimensions?.heightCm ?? 5,
      shipmentType: 'document', // not used in API call, just satisfies type
    });
    if (rates.length > 0) courierId = rates[0].courier_company_id;
  } catch (e) {
    console.warn('[bookingService] Serviceability check failed, using default courier:', e);
  }

  return createDomesticShipment({
    courier_id: courierId,
    pickup: {
      name: pickup.fullName,
      phone: pickup.phone,
      address: pickupAddress1,
      city: pickup.city,
      state: pickup.state,
      pincode: pickupPincode,
    },
    delivery: {
      name: warehouse.name,
      phone: warehouse.phone,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pincode: warehouse.pincode,
    },
    order_amount: req.declaredValue || 1,
    weight: req.weightKg || 0.5,
    length: req.dimensions?.lengthCm ?? 10,
    breadth: req.dimensions?.widthCm ?? 10,
    height: req.dimensions?.heightCm ?? 5,
    payment_type: 'prepaid',
    content_description: `${req.shipmentType} shipment`,
  });
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
  pickupAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
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

export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  // 1. Validate
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

  // 3. Create shipment row — starts at COUNTER (warehouse intake leg)
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
      ...(req.pickupAddress && { pickup_address: req.pickupAddress }),
      ...(req.shippingCost !== undefined && { shipping_cost: req.shippingCost }),
      ...(req.gstAmount !== undefined && { gst_amount: req.gstAmount }),
      ...(req.totalAmount !== undefined && { total_amount: req.totalAmount }),
      ...(req.cxbcPartnerId && { cxbc_partner_id: req.cxbcPartnerId }),
      ...(req.source && { source: req.source }),
    })
    .select('*')
    .single();

  if (insertError || !created) {
    return { success: false, error: `Failed to create shipment: ${insertError?.message ?? 'unknown'}` };
  }

  const shipment = created as unknown as ShipmentRow;

  // 4. Book domestic leg via NimbusPost: customer → warehouse
  //    Skip if credentials not configured (dev/staging)
  const skipNimbus = !process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD;
  let domesticAwb: string | undefined;
  let domesticLabelUrl: string | undefined;

  if (!skipNimbus) {
    const nimbusResult = await bookDomesticLegToWarehouse(req);
    if (nimbusResult.success && nimbusResult.awb) {
      domesticAwb = nimbusResult.awb;
      domesticLabelUrl = nimbusResult.label_url;
    } else {
      // Non-fatal: log but don't fail the booking — admin can manually arrange pickup
      console.warn('[bookingService] Nimbus domestic leg failed (non-fatal):', nimbusResult.error);
    }
  }

  // 5. Persist domestic AWB if obtained
  if (domesticAwb) {
    await supabase
      .from('shipments')
      .update({
        domestic_awb: domesticAwb,
        ...(domesticLabelUrl && { domestic_label_url: domesticLabelUrl }),
      })
      .eq('id', shipment.id);
  }

  // 6. Transition to BOOKING_CONFIRMED
  const result = await updateShipmentStatus({
    shipmentId: shipment.id,
    newStatus: 'BOOKING_CONFIRMED',
    source: 'INTERNAL',
    metadata: { bookingReferenceId: req.bookingReferenceId, domesticAwb },
    expectedVersion: 1,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? 'Failed to confirm booking' };
  }

  return { success: true, shipment: result.shipment };
}

// ---------------------------------------------------------------------------
// dispatchInternational
// ---------------------------------------------------------------------------

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
