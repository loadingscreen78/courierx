/**
 * Adapter layer that transforms booking form data into the lifecycle API schema.
 *
 * Each helper is exported for isolated testing. The main entry point is
 * `adaptBookingData` which orchestrates all transformations.
 */

import { MedicineBookingData } from '@/views/MedicineBooking';
import { DocumentBookingData } from '@/views/DocumentBooking';
import { GiftBookingData } from '@/views/GiftBooking';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pickup address shape shared by all three booking forms. */
interface PickupAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

/** Consignee address shape shared by all three booking forms. */
interface ConsigneeAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  zipcode: string;
}

export interface AdapterInput {
  formData: MedicineBookingData | DocumentBookingData | GiftBookingData;
  shipmentType: 'medicine' | 'document' | 'gift';
  draftId?: string | null;
}

export interface AdaptedBookingRequest {
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
  shippingCost: number;
  gstAmount: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Address formatting
// ---------------------------------------------------------------------------

/**
 * Format an address object into a single text string matching the legacy
 * service pattern:
 *   "{line1}, {line2}, {city}, {stateOrCountry} - {postcodeOrZip}"
 *
 * When `addressLine2` is empty the trailing comma is omitted.
 */
export function formatAddress(
  addr: PickupAddress | ConsigneeAddress,
): string {
  const line2Part = addr.addressLine2 ? addr.addressLine2 + ', ' : '';
  // Pickup addresses use `state` + `pincode`; consignee addresses use `country` + `zipcode`.
  const regionKey = 'state' in addr && (addr as PickupAddress).state
    ? (addr as PickupAddress).state
    : (addr as ConsigneeAddress).country;
  const postcodeKey = 'pincode' in addr && (addr as PickupAddress).pincode
    ? (addr as PickupAddress).pincode
    : (addr as ConsigneeAddress).zipcode;

  return `${addr.addressLine1}, ${line2Part}${addr.city}, ${regionKey} - ${postcodeKey}`;
}

// ---------------------------------------------------------------------------
// Booking reference ID
// ---------------------------------------------------------------------------

/**
 * Generate a booking reference ID.
 * - With a draftId: deterministic `draft-{draftId}` (supports idempotent retries).
 * - Without: unique `booking-{uuid}`.
 */
export function generateBookingReferenceId(draftId?: string | null): string {
  if (draftId) {
    return `draft-${draftId}`;
  }
  return `booking-${crypto.randomUUID()}`;
}

// ---------------------------------------------------------------------------
// Weight computation
// ---------------------------------------------------------------------------

/**
 * Compute the shipment weight in kg using the type-specific formula.
 *
 * - medicine: sum(unitCount × 0.05)  — 50 g per unit
 * - document: max(weight/1000, L×W×H/5000)  — actual vs volumetric
 * - gift:     sum(quantity × 0.5)  — 500 g per item
 */
export function computeWeightKg(
  formData: MedicineBookingData | DocumentBookingData | GiftBookingData,
  type: 'medicine' | 'document' | 'gift',
): number {
  switch (type) {
    case 'medicine': {
      const data = formData as MedicineBookingData;
      return data.medicines.reduce((sum, med) => sum + med.unitCount * 0.05, 0);
    }
    case 'document': {
      const data = formData as DocumentBookingData;
      const actualKg = data.weight / 1000;
      const volumetricKg = (data.length * data.width * data.height) / 5000;
      return Math.max(actualKg, volumetricKg);
    }
    case 'gift': {
      const data = formData as GiftBookingData;
      return data.items.reduce((sum, item) => sum + item.units * 0.5, 0);
    }
  }
}

// ---------------------------------------------------------------------------
// Declared value computation
// ---------------------------------------------------------------------------

/**
 * Compute the declared value using the type-specific formula.
 *
 * - medicine: sum(unitCount × unitPrice)
 * - document: 0 (no commercial value)
 * - gift:     sum(units × unitPrice)  per item
 */
export function computeDeclaredValue(
  formData: MedicineBookingData | DocumentBookingData | GiftBookingData,
  type: 'medicine' | 'document' | 'gift',
): number {
  switch (type) {
    case 'medicine': {
      const data = formData as MedicineBookingData;
      return data.medicines.reduce((sum, med) => sum + med.unitCount * med.unitPrice, 0);
    }
    case 'document':
      return 0;
    case 'gift': {
      const data = formData as GiftBookingData;
      return data.items.reduce((sum, item) => sum + item.units * item.unitPrice, 0);
    }
  }
}

// ---------------------------------------------------------------------------
// Cost computation
// ---------------------------------------------------------------------------

/** Destination multipliers for medicine shipments. */
const MEDICINE_DESTINATION_MULTIPLIER: Record<string, number> = {
  'United States': 1.5,
  'United Kingdom': 1.3,
  'Canada': 1.4,
  'Australia': 1.6,
  'UAE': 1.2,
  'Singapore': 1.3,
};

/** Packet-type multipliers for document shipments. */
const DOCUMENT_PACKET_MULTIPLIER: Record<string, number> = {
  envelope: 1.0,
  'small-packet': 1.2,
  'large-packet': 1.5,
  tube: 1.3,
};

/**
 * Replicate each legacy service's pricing logic.
 *
 * Medicine: base ₹1500 + ₹200/kg (ceil) × destination multiplier + 18% GST
 * Document: chargeableWeight × ₹500/kg × packet multiplier (no GST)
 * Gift:     base GCC ₹1450 / other ₹1850 + ₹100 per item over 3 (no GST)
 *
 * Add-on costs are NOT included here — they are handled separately by the
 * booking form after the lifecycle API call.
 */
export function computeCosts(
  formData: MedicineBookingData | DocumentBookingData | GiftBookingData,
  type: 'medicine' | 'document' | 'gift',
): { shippingCost: number; gstAmount: number; totalAmount: number } {
  switch (type) {
    case 'medicine': {
      const data = formData as MedicineBookingData;
      const totalWeight = data.medicines.reduce(
        (sum, med) => sum + med.unitCount * 0.05,
        0,
      );
      let baseShippingCost = 1500;
      baseShippingCost += Math.ceil(totalWeight) * 200;
      const multiplier =
        MEDICINE_DESTINATION_MULTIPLIER[data.consigneeAddress.country] || 1.0;
      baseShippingCost *= multiplier;

      const gstAmount = baseShippingCost * 0.18;
      const totalAmount = baseShippingCost + gstAmount;

      return {
        shippingCost: Math.round(baseShippingCost),
        gstAmount: Math.round(gstAmount),
        totalAmount: Math.round(totalAmount),
      };
    }

    case 'document': {
      const data = formData as DocumentBookingData;
      const weightInKg = data.weight / 1000;
      const volumetricWeight =
        (data.length * data.width * data.height) / 5000;
      const chargeableWeight = Math.max(weightInKg, volumetricWeight);
      const baseRatePerKg = 500;
      const multiplier =
        DOCUMENT_PACKET_MULTIPLIER[data.packetType] || 1.0;
      const shippingCost = Math.ceil(
        chargeableWeight * baseRatePerKg * multiplier,
      );

      return { shippingCost, gstAmount: 0, totalAmount: shippingCost };
    }

    case 'gift': {
      const data = formData as GiftBookingData;
      const country = data.consigneeAddress.country;
      const isGCC = country === 'AE' || country === 'SA';
      const basePrice = isGCC ? 1450 : 1850;
      const itemCount = data.items.length;
      const extraItemsCost = itemCount > 3 ? (itemCount - 3) * 100 : 0;
      const shippingCost = basePrice + extraItemsCost;

      return { shippingCost, gstAmount: 0, totalAmount: shippingCost };
    }
  }
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

/**
 * Transform booking form data into a payload that conforms to the lifecycle
 * API's `bookingRequestSchema`.
 */
export function adaptBookingData(input: AdapterInput): AdaptedBookingRequest {
  const { formData, shipmentType, draftId } = input;

  const bookingReferenceId = generateBookingReferenceId(draftId);
  const originAddress = formatAddress(formData.pickupAddress as PickupAddress);
  const destinationAddress = formatAddress(
    formData.consigneeAddress as ConsigneeAddress,
  );
  const weightKg = computeWeightKg(formData, shipmentType);
  const declaredValue = computeDeclaredValue(formData, shipmentType);
  const costs = computeCosts(formData, shipmentType);

  const result: AdaptedBookingRequest = {
    bookingReferenceId,
    recipientName: formData.consigneeAddress.fullName,
    recipientPhone: formData.consigneeAddress.phone,
    originAddress,
    destinationAddress,
    destinationCountry: formData.consigneeAddress.country,
    weightKg,
    declaredValue,
    shipmentType,
    shippingCost: costs.shippingCost,
    gstAmount: costs.gstAmount,
    totalAmount: costs.totalAmount,
  };

  // Include email when present
  if (formData.consigneeAddress.email) {
    result.recipientEmail = formData.consigneeAddress.email;
  }

  // Include dimensions for document shipments
  if (shipmentType === 'document') {
    const doc = formData as DocumentBookingData;
    result.dimensions = {
      lengthCm: doc.length,
      widthCm: doc.width,
      heightCm: doc.height,
    };
  }

  return result;
}
