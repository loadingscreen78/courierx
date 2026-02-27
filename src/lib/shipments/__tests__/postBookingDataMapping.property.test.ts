import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { DocumentBookingData } from '@/views/DocumentBooking';
import type { GiftBookingData, GiftItem, SafetyChecklist } from '@/views/GiftBooking';

// Feature: booking-lifecycle-integration, Property 11: Post-booking data mapping produces correct rows

/**
 * Property 11: Post-booking data mapping produces correct rows
 *
 * For any valid form data and shipment ID:
 * - insertMedicineItems SHALL produce one medicine_items row per medicine in the input,
 *   each with the correct shipment_id
 * - insertDocumentItems SHALL produce one document_items row with the correct shipment_id
 * - insertGiftItems SHALL produce one gift_items row per gift item with the correct shipment_id
 * - insertAddons SHALL produce one shipment_addons row per add-on with the correct
 *   shipment_id and addon_cost
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 */

// ---------------------------------------------------------------------------
// Supabase mock — capture rows passed to .insert()
// ---------------------------------------------------------------------------

let capturedInserts: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      insert: vi.fn((rows: unknown | unknown[]) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        if (!capturedInserts[table]) capturedInserts[table] = [];
        capturedInserts[table].push(...arr);
        return Promise.resolve({ error: null });
      }),
    })),
  },
}));

// Mock storage service (imported by postBookingService but not used in these tests)
vi.mock('@/lib/storage/storageService', () => ({
  uploadWithValidation: vi.fn(),
  STORAGE_BUCKETS: { SHIPMENT_DOCUMENTS: 'shipment-documents' },
  FILE_TYPES: { DOCUMENTS: ['application/pdf'] },
}));

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const shipmentIdArb = fc.uuid();

const medicineArb = fc.record({
  id: fc.uuid(),
  medicineType: fc.constantFrom('allopathy' as const, 'homeopathy' as const, 'ayurvedic' as const, 'other' as const),
  category: fc.constantFrom('branded' as const, 'generic' as const),
  form: fc.constantFrom('tablet' as const, 'capsule' as const, 'liquid' as const, 'semi-liquid' as const, 'powder' as const),
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

const pickupAddressArb = fc.record({
  fullName: fc.constant('Sender Name'),
  phone: fc.constant('+919876543210'),
  addressLine1: fc.constant('123 Main St'),
  addressLine2: fc.constant(''),
  city: fc.constant('Mumbai'),
  state: fc.constant('Maharashtra'),
  pincode: fc.constant('400001'),
});

const consigneeAddressArb = fc.record({
  fullName: fc.constant('Receiver Name'),
  phone: fc.constant('+14155551234'),
  email: fc.constant('test@example.com'),
  addressLine1: fc.constant('456 Oak Ave'),
  addressLine2: fc.constant(''),
  city: fc.constant('New York'),
  country: fc.constant('United States'),
  zipcode: fc.constant('10001'),
});

const medicineConsigneeArb = fc.record({
  fullName: fc.constant('Receiver Name'),
  phone: fc.constant('+14155551234'),
  email: fc.constant('test@example.com'),
  addressLine1: fc.constant('456 Oak Ave'),
  addressLine2: fc.constant(''),
  city: fc.constant('New York'),
  country: fc.constant('United States'),
  zipcode: fc.constant('10001'),
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

const addonArb = fc.record({
  type: fc.constantFrom('insurance', 'special_packaging', 'gift_wrapping', 'waterproof'),
  name: fc.constantFrom('Insurance', 'Special Packaging', 'Gift Wrapping', 'Waterproof Packaging'),
  cost: fc.double({ min: 50, max: 500, noNaN: true, noDefaultInfinity: true }),
});

// ---------------------------------------------------------------------------
// Import the functions under test (after mocks are set up)
// ---------------------------------------------------------------------------

import {
  insertMedicineItems,
  insertDocumentItems,
  insertGiftItems,
  insertAddons,
} from '../postBookingService';

// ---------------------------------------------------------------------------
// Tests — use fc.asyncProperty for async insert functions
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedInserts = {};
});

describe('Property 11: Post-booking data mapping produces correct rows', () => {

  it('insertMedicineItems produces one row per medicine with correct shipment_id and field mapping', async () => {
    await fc.assert(
      fc.asyncProperty(shipmentIdArb, medicineBookingDataArb, async (shipmentId, data) => {
        capturedInserts = {};
        await insertMedicineItems(shipmentId, data);

        const rows = capturedInserts['medicine_items'] ?? [];
        expect(rows.length).toBe(data.medicines.length);

        for (let i = 0; i < data.medicines.length; i++) {
          const med = data.medicines[i];
          const row = rows[i] as Record<string, unknown>;

          expect(row.shipment_id).toBe(shipmentId);
          expect(row.medicine_type).toBe(med.medicineType);
          expect(row.category).toBe(med.category);
          expect(row.form).toBe(med.form);
          expect(row.medicine_name).toBe(med.medicineName);
          expect(row.unit_count).toBe(med.unitCount);
          expect(row.unit_price).toBe(med.unitPrice);
          expect(row.daily_dosage).toBe(med.dailyDosage);
          expect(row.manufacturer_name).toBe(med.manufacturerName);
          expect(row.manufacturer_address).toBe(med.manufacturerAddress);
          expect(row.batch_no).toBe(med.batchNo);
          expect(row.hsn_code).toBe(med.hsnCode);
          expect(row.is_controlled).toBe(med.isControlled);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('insertDocumentItems produces exactly one row with correct shipment_id and field mapping', async () => {
    await fc.assert(
      fc.asyncProperty(shipmentIdArb, documentBookingDataArb, async (shipmentId, data) => {
        capturedInserts = {};
        await insertDocumentItems(shipmentId, data);

        const rows = capturedInserts['document_items'] ?? [];
        expect(rows.length).toBe(1);

        const row = rows[0] as Record<string, unknown>;
        expect(row.shipment_id).toBe(shipmentId);
        expect(row.packet_type).toBe(data.packetType);
        expect(row.document_type).toBe(data.documentType);
        expect(row.description).toBe(data.description);
        expect(row.weight_grams).toBe(data.weight);
        expect(row.length_cm).toBe(data.length);
        expect(row.width_cm).toBe(data.width);
        expect(row.height_cm).toBe(data.height);
        expect(row.insurance).toBe(data.insurance);
        expect(row.waterproof_packaging).toBe(data.waterproofPackaging);
      }),
      { numRuns: 100 },
    );
  });

  it('insertGiftItems produces one row per gift item with correct shipment_id and field mapping', async () => {
    await fc.assert(
      fc.asyncProperty(shipmentIdArb, giftBookingDataArb, async (shipmentId, data) => {
        capturedInserts = {};
        await insertGiftItems(shipmentId, data);

        const rows = capturedInserts['gift_items'] ?? [];
        expect(rows.length).toBe(data.items.length);

        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const row = rows[i] as Record<string, unknown>;

          expect(row.shipment_id).toBe(shipmentId);
          expect(row.item_name).toBe(item.name);
          expect(row.hsn_code).toBe(item.hsnCode);
          expect(row.description).toBe(item.description);
          expect(row.quantity).toBe(item.units);
          expect(row.unit_price).toBe(item.unitPrice);
          expect(row.total_value).toBe(item.units * item.unitPrice);
          expect(row.insurance).toBe(data.insurance);
          expect(row.gift_wrapping).toBe(data.giftWrapping);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('insertAddons produces one row per add-on with correct shipment_id and addon_cost', async () => {
    await fc.assert(
      fc.asyncProperty(
        shipmentIdArb,
        fc.array(addonArb, { minLength: 1, maxLength: 5 }),
        async (shipmentId, addons) => {
          capturedInserts = {};
          await insertAddons(shipmentId, addons);

          const rows = capturedInserts['shipment_addons'] ?? [];
          expect(rows.length).toBe(addons.length);

          for (let i = 0; i < addons.length; i++) {
            const addon = addons[i];
            const row = rows[i] as Record<string, unknown>;

            expect(row.shipment_id).toBe(shipmentId);
            expect(row.addon_type).toBe(addon.type);
            expect(row.addon_name).toBe(addon.name);
            expect(row.addon_cost).toBe(addon.cost);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('insertAddons with empty array does not insert any rows', async () => {
    await fc.assert(
      fc.asyncProperty(shipmentIdArb, async (shipmentId) => {
        capturedInserts = {};
        await insertAddons(shipmentId, []);

        // No table should have been touched
        expect(capturedInserts['shipment_addons']).toBeUndefined();
      }),
      { numRuns: 10 },
    );
  });
});
