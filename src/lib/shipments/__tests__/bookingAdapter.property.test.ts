import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { adaptBookingData } from '../bookingAdapter';
import { bookingRequestSchema } from '../../shipment-lifecycle/inputValidator';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { DocumentBookingData } from '@/views/DocumentBooking';
import type { GiftBookingData, GiftItem, SafetyChecklist } from '@/views/GiftBooking';

// Feature: booking-lifecycle-integration, Property 1: Adapter produces valid schema output for all shipment types

/**
 * Property 1: Adapter produces valid schema output for all shipment types
 *
 * For any valid MedicineBookingData, DocumentBookingData, or GiftBookingData,
 * calling adaptBookingData with the corresponding shipment type SHALL produce
 * an object that passes bookingRequestSchema.safeParse() without validation errors.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 9.3**
 */

// ---------------------------------------------------------------------------
// Shared address generators
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
// Medicine form data generator
// ---------------------------------------------------------------------------

const medicineArb = fc.record({
  id: fc.uuid(),
  medicineType: fc.constantFrom('allopathy', 'homeopathy', 'ayurvedic', 'other'),
  category: fc.constantFrom('branded', 'generic'),
  form: fc.constantFrom('tablet', 'capsule', 'liquid', 'semi-liquid', 'powder'),
  medicineName: fc.string({ minLength: 1, maxLength: 30, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Med'),
  unitCount: fc.integer({ min: 1, max: 100 }), // Capped so total weight stays ≤ 30kg (100 units * 5 items * 0.05 = 25kg max)
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

// Medicine consignee address includes passportNumber field
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
// Document form data generator
// ---------------------------------------------------------------------------

const documentBookingDataArb: fc.Arbitrary<DocumentBookingData> = fc.record({
  packetType: fc.constantFrom('envelope' as const, 'small-packet' as const, 'large-packet' as const, 'tube' as const),
  documentType: fc.constant('legal'),
  description: fc.constant('Test document'),
  weight: fc.integer({ min: 100, max: 5000 }), // grams, must produce weight ≤ 30kg
  length: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }), // cm, constrained so volumetric ≤ 30
  width: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
  height: fc.double({ min: 1, max: 30, noNaN: true, noDefaultInfinity: true }),
  pickupAddress: pickupAddressArb,
  consigneeAddress: consigneeAddressArb,
  insurance: fc.boolean(),
  waterproofPackaging: fc.boolean(),
}) as fc.Arbitrary<DocumentBookingData>;

// ---------------------------------------------------------------------------
// Gift form data generator
// ---------------------------------------------------------------------------

const giftItemArb: fc.Arbitrary<GiftItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30, unit: 'grapheme' }).map(s => s.replace(/[^\w ]/g, 'a') || 'Gift'),
  description: fc.constant('A gift item'),
  units: fc.integer({ min: 1, max: 10 }), // Capped so total weight stays ≤ 30kg (10 units * 5 items * 0.5 = 25kg max)
  unitPrice: fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }),
  hsnCode: fc.constant('71171990'),
});

const safetyChecklistArb: fc.Arbitrary<SafetyChecklist> = fc.record({
  containsBattery: fc.boolean(),
  containsChemical: fc.boolean(),
  containsLiquid: fc.boolean(),
  containsImitationJewellery: fc.boolean(),
});

const giftBookingDataArb: fc.Arbitrary<GiftBookingData> = fc.record({
  items: fc.array(giftItemArb, { minLength: 1, maxLength: 5 }),
  safetyChecklist: safetyChecklistArb,
  prohibitedItemAttempted: fc.boolean(),
  pickupAddress: pickupAddressArb,
  consigneeAddress: consigneeAddressArb,
  passportPhotoPage: fc.constant(null),
  passportAddressPage: fc.constant(null),
  insurance: fc.boolean(),
  giftWrapping: fc.boolean(),
}) as fc.Arbitrary<GiftBookingData>;


// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 1: Adapter produces valid schema output for all shipment types', () => {

  it('produces valid schema output for medicine shipments', () => {
    fc.assert(
      fc.property(medicineBookingDataArb, (formData) => {
        const result = adaptBookingData({
          formData,
          shipmentType: 'medicine',
        });

        const parsed = bookingRequestSchema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
        expect(parsed.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('produces valid schema output for document shipments', () => {
    fc.assert(
      fc.property(documentBookingDataArb, (formData) => {
        const result = adaptBookingData({
          formData,
          shipmentType: 'document',
        });

        const parsed = bookingRequestSchema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
        expect(parsed.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('produces valid schema output for gift shipments', () => {
    fc.assert(
      fc.property(giftBookingDataArb, (formData) => {
        const result = adaptBookingData({
          formData,
          shipmentType: 'gift',
        });

        const parsed = bookingRequestSchema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
        expect(parsed.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('produces valid schema output with draft IDs for all types', () => {
    const draftIdArb = fc.uuid();
    const typeAndDataArb = fc.oneof(
      fc.tuple(fc.constant('medicine' as const), medicineBookingDataArb),
      fc.tuple(fc.constant('document' as const), documentBookingDataArb),
      fc.tuple(fc.constant('gift' as const), giftBookingDataArb),
    );

    fc.assert(
      fc.property(typeAndDataArb, draftIdArb, ([shipmentType, formData], draftId) => {
        const result = adaptBookingData({
          formData,
          shipmentType,
          draftId,
        });

        const parsed = bookingRequestSchema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed for ${shipmentType} with draftId: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
        expect(parsed.success).toBe(true);

        // Verify the booking reference uses the draft prefix
        expect(result.bookingReferenceId).toBe(`draft-${draftId}`);
      }),
      { numRuns: 100 },
    );
  });
});
