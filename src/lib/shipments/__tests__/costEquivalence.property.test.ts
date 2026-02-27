import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeCosts } from '../bookingAdapter';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { DocumentBookingData } from '@/views/DocumentBooking';
import type { GiftBookingData, GiftItem, SafetyChecklist } from '@/views/GiftBooking';

// Feature: booking-lifecycle-integration, Property 6: Cost computation equivalence with legacy services

/**
 * Property 6: Cost computation equivalence with legacy services
 *
 * For any valid form data, the adapter's computeCosts SHALL produce the same
 * shippingCost, gstAmount, and totalAmount (before add-ons) as the legacy
 * calculateShippingCosts / calculateShippingCost functions.
 *
 * The legacy functions are private to their modules, so we replicate their
 * exact logic here as the oracle.
 *
 * **Validates: Requirements 4.2**
 */

// ---------------------------------------------------------------------------
// Legacy oracle functions (exact copies of the private legacy implementations)
// ---------------------------------------------------------------------------

/**
 * Oracle: medicineShipmentService.ts → calculateShippingCosts
 * Returns { shippingCost, gstAmount, totalAmount } (before add-ons).
 */
function legacyMedicineCosts(medicines: MedicineBookingData['medicines'], country: string) {
  const totalWeight = medicines.reduce((sum, med) => sum + med.unitCount * 0.05, 0);

  let baseShippingCost = 1500;
  baseShippingCost += Math.ceil(totalWeight) * 200;

  const destinationMultiplier: Record<string, number> = {
    'United States': 1.5,
    'United Kingdom': 1.3,
    'Canada': 1.4,
    'Australia': 1.6,
    'UAE': 1.2,
    'Singapore': 1.3,
  };
  const multiplier = destinationMultiplier[country] || 1.0;
  baseShippingCost *= multiplier;

  const gstAmount = baseShippingCost * 0.18;
  const totalAmount = baseShippingCost + gstAmount;

  return {
    shippingCost: Math.round(baseShippingCost),
    gstAmount: Math.round(gstAmount),
    totalAmount: Math.round(totalAmount),
  };
}

/**
 * Oracle: documentShipmentService.ts → calculateShippingCost
 */
function legacyDocumentCost(data: DocumentBookingData) {
  const weightInKg = data.weight / 1000;
  const volumetricWeight = (data.length * data.width * data.height) / 5000;
  const chargeableWeight = Math.max(weightInKg, volumetricWeight);

  const baseRatePerKg = 500;

  const packetMultiplier: Record<string, number> = {
    envelope: 1.0,
    'small-packet': 1.2,
    'large-packet': 1.5,
    tube: 1.3,
  };
  const multiplier = packetMultiplier[data.packetType] || 1.0;

  const shippingCost = Math.ceil(chargeableWeight * baseRatePerKg * multiplier);
  return { shippingCost, gstAmount: 0, totalAmount: shippingCost };
}

/**
 * Oracle: giftShipmentService.ts → calculateShippingCost
 */
function legacyGiftCost(data: GiftBookingData) {
  const itemCount = data.items.length;
  const country = data.consigneeAddress.country;
  const isGCC = country === 'AE' || country === 'SA';
  const basePrice = isGCC ? 1450 : 1850;
  const extraItemsCost = itemCount > 3 ? (itemCount - 3) * 100 : 0;
  const shippingCost = basePrice + extraItemsCost;
  return { shippingCost, gstAmount: 0, totalAmount: shippingCost };
}

// ---------------------------------------------------------------------------
// Shared generators (reused from bookingAdapter.property.test.ts)
// ---------------------------------------------------------------------------

const pickupAddressArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Name'),
  phone: fc.constantFrom('+919876543210', '+14155551234', '+442071234567'),
  addressLine1: fc.string({ minLength: 1, maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Addr1'),
  addressLine2: fc.string({ maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, '')),
  city: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'City'),
  state: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'State'),
  pincode: fc.stringMatching(/^[1-9]\d{5}$/),
});

const consigneeAddressArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Name'),
  phone: fc.constantFrom('+919876543210', '+14155551234', '+442071234567'),
  email: fc.constantFrom('test@example.com', 'user@mail.org', ''),
  addressLine1: fc.string({ minLength: 1, maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Addr1'),
  addressLine2: fc.string({ maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, '')),
  city: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'City'),
  country: fc.constantFrom('United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Singapore', 'India', 'Germany'),
  zipcode: fc.stringMatching(/^[1-9]\d{4,5}$/),
});

// ---------------------------------------------------------------------------
// Medicine generators
// ---------------------------------------------------------------------------

const medicineArb = fc.record({
  id: fc.uuid(),
  medicineType: fc.constantFrom('allopathy', 'homeopathy', 'ayurvedic', 'other'),
  category: fc.constantFrom('branded', 'generic'),
  form: fc.constantFrom('tablet', 'capsule', 'liquid', 'semi-liquid', 'powder'),
  medicineName: fc.string({ minLength: 1, maxLength: 30, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Med'),
  unitCount: fc.integer({ min: 1, max: 100 }),
  unitPrice: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
  dailyDosage: fc.integer({ min: 1, max: 10 }),
  manufacturerName: fc.constant('TestMfg'),
  manufacturerAddress: fc.constant('TestAddr'),
  mfgDate: fc.constant(null),
  batchNo: fc.constant('BATCH001'),
  expiryDate: fc.constant(null),
  hsnCode: fc.constant('30049099'),
  isControlled: fc.boolean(),
});

const medicineConsigneeArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Name'),
  phone: fc.constantFrom('+919876543210', '+14155551234', '+442071234567'),
  email: fc.constantFrom('test@example.com', 'user@mail.org', ''),
  addressLine1: fc.string({ minLength: 1, maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Addr1'),
  addressLine2: fc.string({ maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, '')),
  city: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'City'),
  country: fc.constantFrom('United States', 'United Kingdom', 'Canada', 'Australia', 'UAE', 'Singapore', 'India', 'Germany'),
  zipcode: fc.stringMatching(/^[1-9]\d{4,5}$/),
  passportNumber: fc.constant('A12345678'),
});

const medicineBookingDataArb: fc.Arbitrary<MedicineBookingData> = fc.record({
  medicines: fc.array(medicineArb, { minLength: 1, maxLength: 5 }),
  pickupAddress: pickupAddressArb,
  consigneeAddress: medicineConsigneeArb,
  prescription: fc.constant(null),
  pharmacyBill: fc.constant(null),
  consigneeId: fc.constant(null),
  insurance: fc.boolean(),
  specialPackaging: fc.boolean(),
}) as fc.Arbitrary<MedicineBookingData>;

// ---------------------------------------------------------------------------
// Document generators
// ---------------------------------------------------------------------------

const documentBookingDataArb: fc.Arbitrary<DocumentBookingData> = fc.record({
  packetType: fc.constantFrom('envelope' as const, 'small-packet' as const, 'large-packet' as const, 'tube' as const),
  documentType: fc.constant('legal'),
  description: fc.constant('Test document'),
  weight: fc.integer({ min: 100, max: 5000 }),
  length: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
  width: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
  height: fc.double({ min: 1, max: 30, noNaN: true, noDefaultInfinity: true }),
  pickupAddress: pickupAddressArb,
  consigneeAddress: consigneeAddressArb,
  insurance: fc.boolean(),
  waterproofPackaging: fc.boolean(),
}) as fc.Arbitrary<DocumentBookingData>;

// ---------------------------------------------------------------------------
// Gift generators
// ---------------------------------------------------------------------------

const giftItemArb: fc.Arbitrary<GiftItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Gift'),
  description: fc.constant('A gift item'),
  units: fc.integer({ min: 1, max: 10 }),
  unitPrice: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
  hsnCode: fc.constant('71171990'),
});

const safetyChecklistArb: fc.Arbitrary<SafetyChecklist> = fc.record({
  containsBattery: fc.boolean(),
  containsChemical: fc.boolean(),
  containsLiquid: fc.boolean(),
  containsImitationJewellery: fc.boolean(),
});

// Gift consignee needs AE/SA for GCC testing coverage
const giftConsigneeArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Name'),
  phone: fc.constantFrom('+919876543210', '+14155551234'),
  email: fc.constantFrom('test@example.com', ''),
  addressLine1: fc.string({ minLength: 1, maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Addr1'),
  addressLine2: fc.string({ maxLength: 80, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, '')),
  city: fc.string({ minLength: 1, maxLength: 50, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'City'),
  country: fc.constantFrom('AE', 'SA', 'United States', 'United Kingdom', 'India', 'Germany'),
  zipcode: fc.stringMatching(/^[1-9]\d{4,5}$/),
});

const giftBookingDataArb: fc.Arbitrary<GiftBookingData> = fc.record({
  items: fc.array(giftItemArb, { minLength: 1, maxLength: 8 }), // up to 8 to test extra-items surcharge
  safetyChecklist: safetyChecklistArb,
  prohibitedItemAttempted: fc.boolean(),
  pickupAddress: pickupAddressArb,
  consigneeAddress: giftConsigneeArb,
  passportPhotoPage: fc.constant(null),
  passportAddressPage: fc.constant(null),
  insurance: fc.boolean(),
  giftWrapping: fc.boolean(),
}) as fc.Arbitrary<GiftBookingData>;


// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 6: Cost computation equivalence with legacy services', () => {

  it('medicine: computeCosts matches legacy calculateShippingCosts', () => {
    fc.assert(
      fc.property(medicineBookingDataArb, (formData) => {
        const adapterResult = computeCosts(formData, 'medicine');
        const legacyResult = legacyMedicineCosts(
          formData.medicines,
          formData.consigneeAddress.country,
        );

        expect(adapterResult.shippingCost).toBe(legacyResult.shippingCost);
        expect(adapterResult.gstAmount).toBe(legacyResult.gstAmount);
        expect(adapterResult.totalAmount).toBe(legacyResult.totalAmount);
      }),
      { numRuns: 100 },
    );
  });

  it('document: computeCosts matches legacy calculateShippingCost', () => {
    fc.assert(
      fc.property(documentBookingDataArb, (formData) => {
        const adapterResult = computeCosts(formData, 'document');
        const legacyResult = legacyDocumentCost(formData);

        expect(adapterResult.shippingCost).toBe(legacyResult.shippingCost);
        expect(adapterResult.gstAmount).toBe(legacyResult.gstAmount);
        expect(adapterResult.totalAmount).toBe(legacyResult.totalAmount);
      }),
      { numRuns: 100 },
    );
  });

  it('gift: computeCosts matches legacy calculateShippingCost', () => {
    fc.assert(
      fc.property(giftBookingDataArb, (formData) => {
        const adapterResult = computeCosts(formData, 'gift');
        const legacyResult = legacyGiftCost(formData);

        expect(adapterResult.shippingCost).toBe(legacyResult.shippingCost);
        expect(adapterResult.gstAmount).toBe(legacyResult.gstAmount);
        expect(adapterResult.totalAmount).toBe(legacyResult.totalAmount);
      }),
      { numRuns: 100 },
    );
  });

  it('all types: shippingCost is always non-negative', () => {
    const typeAndDataArb = fc.oneof(
      fc.tuple(fc.constant('medicine' as const), medicineBookingDataArb),
      fc.tuple(fc.constant('document' as const), documentBookingDataArb),
      fc.tuple(fc.constant('gift' as const), giftBookingDataArb),
    );

    fc.assert(
      fc.property(typeAndDataArb, ([type, formData]) => {
        const result = computeCosts(formData, type);
        expect(result.shippingCost).toBeGreaterThanOrEqual(0);
        expect(result.gstAmount).toBeGreaterThanOrEqual(0);
        expect(result.totalAmount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('all types: totalAmount equals shippingCost + gstAmount', () => {
    const typeAndDataArb = fc.oneof(
      fc.tuple(fc.constant('medicine' as const), medicineBookingDataArb),
      fc.tuple(fc.constant('document' as const), documentBookingDataArb),
      fc.tuple(fc.constant('gift' as const), giftBookingDataArb),
    );

    fc.assert(
      fc.property(typeAndDataArb, ([type, formData]) => {
        const result = computeCosts(formData, type);
        // For medicine, rounding may cause ±1 difference, so we check the
        // relationship holds within the rounding tolerance.
        expect(Math.abs(result.totalAmount - (result.shippingCost + result.gstAmount))).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });
});
