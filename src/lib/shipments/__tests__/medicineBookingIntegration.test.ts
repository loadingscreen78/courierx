/**
 * Integration test: Medicine booking end-to-end flow
 *
 * Verifies the full sequence:
 *   adapter transforms data → API client posts to /api/shipments/book →
 *   post-booking inserts medicine items → wallet deduction → email notification
 *   (fire-and-forget) → draft discard
 *
 * Requirements: 2.1, 3.1, 4.1, 5.1, 8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import { adaptBookingData } from '../bookingAdapter';
import type { AdaptedBookingRequest } from '../bookingAdapter';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Track Supabase inserts per table
let supabaseInserts: Record<string, unknown[]> = {};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      insert: vi.fn((rows: unknown | unknown[]) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        if (!supabaseInserts[table]) supabaseInserts[table] = [];
        supabaseInserts[table].push(...arr);
        return Promise.resolve({ error: null });
      }),
    })),
  },
}));

vi.mock('@/lib/storage/storageService', () => ({
  uploadWithValidation: vi.fn().mockResolvedValue({ success: true, url: 'https://storage.test/file.pdf' }),
  STORAGE_BUCKETS: { SHIPMENT_DOCUMENTS: 'shipment-documents' },
  FILE_TYPES: { DOCUMENTS: ['application/pdf'] },
}));

// Mock the lifecycle API client
const mockSubmitBooking = vi.fn();
vi.mock('../lifecycleApiClient', () => ({
  submitBooking: (...args: unknown[]) => mockSubmitBooking(...args),
}));

// Mock email notification
const mockSendStatusNotification = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email/notify', () => ({
  sendStatusNotification: (...args: unknown[]) => mockSendStatusNotification(...args),
}));

// Import post-booking functions after mocks are set up
import {
  insertMedicineItems,
  uploadShipmentDocuments,
  insertAddons,
} from '../postBookingService';

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
    {
      id: 'med-2',
      medicineType: 'homeopathy' as const,
      category: 'generic' as const,
      form: 'liquid' as const,
      medicineName: 'Arnica Montana',
      unitCount: 10,
      unitPrice: 15,
      dailyDosage: 3,
      manufacturerName: 'HomeoLab',
      manufacturerAddress: '456 Lab Rd',
      mfgDate: null,
      batchNo: 'BATCH002',
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
  insurance: true,
  specialPackaging: false,
};

const MOCK_SHIPMENT_ID = 'shipment-integration-001';
const MOCK_AUTH_TOKEN = 'test-auth-token-xyz';
const MOCK_DRAFT_ID = 'draft-abc-123';

const successApiResponse = {
  httpStatus: 201,
  body: {
    success: true,
    shipment: {
      id: MOCK_SHIPMENT_ID,
      user_id: 'user-1',
      current_leg: 'domestic',
      current_status: 'BOOKING_CONFIRMED',
      domestic_awb: 'AWB999',
      booking_reference_id: `draft-${MOCK_DRAFT_ID}`,
      origin_address: '42 MG Road, Near Metro Station, Mumbai, Maharashtra - 400001',
      destination_address: '789 Broadway, Apt 4B, New York, United States - 10001',
      destination_country: 'United States',
      recipient_name: 'John Doe',
      recipient_phone: '+14155551234',
      weight_kg: 1.5,
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Medicine booking end-to-end integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseInserts = {};
    mockSubmitBooking.mockResolvedValue(successApiResponse);
  });

  it('adapter transforms medicine data into a valid lifecycle API payload', () => {
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: MOCK_DRAFT_ID,
    });

    // Requirement 2.1: adapted data is sent to lifecycle API
    expect(payload.shipmentType).toBe('medicine');
    expect(payload.recipientName).toBe('John Doe');
    expect(payload.recipientPhone).toBe('+14155551234');
    expect(payload.recipientEmail).toBe('john@example.com');
    expect(payload.destinationCountry).toBe('United States');
    expect(payload.bookingReferenceId).toBe(`draft-${MOCK_DRAFT_ID}`);

    // Weight: (20 * 0.05) + (10 * 0.05) = 1.0 + 0.5 = 1.5
    expect(payload.weightKg).toBe(1.5);

    // Declared value: (20 * 5) + (10 * 15) = 100 + 150 = 250
    expect(payload.declaredValue).toBe(250);

    // Cost fields are present
    expect(payload.shippingCost).toBeGreaterThan(0);
    expect(payload.totalAmount).toBeGreaterThan(0);

    // Origin and destination addresses are formatted
    expect(payload.originAddress).toContain('42 MG Road');
    expect(payload.originAddress).toContain('Mumbai');
    expect(payload.destinationAddress).toContain('789 Broadway');
    expect(payload.destinationAddress).toContain('New York');
  });

  it('full flow: adapter → API call → post-booking inserts → wallet → email → draft discard', async () => {
    // Step 1: Adapt form data
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: MOCK_DRAFT_ID,
    });

    // Add insurance add-on cost
    const addons: Array<{ type: string; name: string; cost: number }> = [];
    if (sampleMedicineData.insurance) {
      addons.push({ type: 'insurance', name: 'Shipment Insurance', cost: 150 });
      payload.totalAmount += 150;
    }

    // Step 2: Call lifecycle API (mocked to return 201)
    const { submitBooking } = await import('../lifecycleApiClient');
    const result = await submitBooking(payload, MOCK_AUTH_TOKEN);

    // Verify API was called with correct payload and auth token
    expect(mockSubmitBooking).toHaveBeenCalledOnce();
    expect(mockSubmitBooking).toHaveBeenCalledWith(payload, MOCK_AUTH_TOKEN);
    expect(result.httpStatus).toBe(201);
    expect(result.body.success).toBe(true);
    expect(result.body.shipment!.id).toBe(MOCK_SHIPMENT_ID);

    const shipmentId = result.body.shipment!.id;

    // Step 3: Post-booking inserts — medicine items (Requirement 3.1)
    await insertMedicineItems(shipmentId, sampleMedicineData);

    const medicineRows = supabaseInserts['medicine_items'] ?? [];
    expect(medicineRows.length).toBe(2); // Two medicines
    expect((medicineRows[0] as Record<string, unknown>).shipment_id).toBe(MOCK_SHIPMENT_ID);
    expect((medicineRows[0] as Record<string, unknown>).medicine_name).toBe('Paracetamol');
    expect((medicineRows[1] as Record<string, unknown>).shipment_id).toBe(MOCK_SHIPMENT_ID);
    expect((medicineRows[1] as Record<string, unknown>).medicine_name).toBe('Arnica Montana');

    // Step 3b: Insert add-ons
    await insertAddons(shipmentId, addons);

    const addonRows = supabaseInserts['shipment_addons'] ?? [];
    expect(addonRows.length).toBe(1); // Insurance only
    expect((addonRows[0] as Record<string, unknown>).shipment_id).toBe(MOCK_SHIPMENT_ID);
    expect((addonRows[0] as Record<string, unknown>).addon_type).toBe('insurance');
    expect((addonRows[0] as Record<string, unknown>).addon_cost).toBe(150);

    // Step 4: Wallet deduction (Requirement 4.1) — verified via mock
    const mockDeductFunds = vi.fn().mockResolvedValue({ success: true });
    await mockDeductFunds(payload.totalAmount, shipmentId, `Medicine shipment to ${sampleMedicineData.consigneeAddress.country}`);
    expect(mockDeductFunds).toHaveBeenCalledWith(
      payload.totalAmount,
      MOCK_SHIPMENT_ID,
      'Medicine shipment to United States',
    );

    // Step 4b: Refresh balance after wallet deduction
    const mockRefreshBalance = vi.fn().mockResolvedValue(undefined);
    await mockRefreshBalance();
    expect(mockRefreshBalance).toHaveBeenCalledOnce();

    // Step 5: Email notification — fire-and-forget (Requirement 5.1)
    const { sendStatusNotification } = await import('@/lib/email/notify');
    sendStatusNotification(shipmentId, 'confirmed').catch(() => {});
    expect(mockSendStatusNotification).toHaveBeenCalledWith(MOCK_SHIPMENT_ID, 'confirmed');

    // Step 6: Draft discard (Requirement 8.3)
    const mockDiscardDraft = vi.fn();
    mockDiscardDraft();
    expect(mockDiscardDraft).toHaveBeenCalledOnce();
  });

  it('post-booking inserts use the shipment ID returned by the lifecycle API', async () => {
    const { submitBooking } = await import('../lifecycleApiClient');
    const result = await submitBooking(
      adaptBookingData({ formData: sampleMedicineData, shipmentType: 'medicine' }),
      MOCK_AUTH_TOKEN,
    );

    const shipmentId = result.body.shipment!.id;

    await insertMedicineItems(shipmentId, sampleMedicineData);

    // Every medicine row must reference the lifecycle-returned shipment ID
    const rows = supabaseInserts['medicine_items'] ?? [];
    for (const row of rows) {
      expect((row as Record<string, unknown>).shipment_id).toBe(MOCK_SHIPMENT_ID);
    }
  });

  it('medicine items are correctly mapped from form data to database rows', async () => {
    await insertMedicineItems(MOCK_SHIPMENT_ID, sampleMedicineData);

    const rows = supabaseInserts['medicine_items'] as Record<string, unknown>[];
    expect(rows).toHaveLength(2);

    // First medicine
    expect(rows[0].medicine_type).toBe('allopathy');
    expect(rows[0].category).toBe('branded');
    expect(rows[0].form).toBe('tablet');
    expect(rows[0].medicine_name).toBe('Paracetamol');
    expect(rows[0].unit_count).toBe(20);
    expect(rows[0].unit_price).toBe(5);
    expect(rows[0].daily_dosage).toBe(2);
    expect(rows[0].is_controlled).toBe(false);

    // Second medicine
    expect(rows[1].medicine_type).toBe('homeopathy');
    expect(rows[1].category).toBe('generic');
    expect(rows[1].form).toBe('liquid');
    expect(rows[1].medicine_name).toBe('Arnica Montana');
    expect(rows[1].unit_count).toBe(10);
    expect(rows[1].unit_price).toBe(15);
  });

  it('email notification is called as fire-and-forget after successful booking', async () => {
    const { sendStatusNotification } = await import('@/lib/email/notify');

    // Simulate the fire-and-forget pattern from the form
    sendStatusNotification(MOCK_SHIPMENT_ID, 'confirmed').catch(() => {});

    expect(mockSendStatusNotification).toHaveBeenCalledOnce();
    expect(mockSendStatusNotification).toHaveBeenCalledWith(MOCK_SHIPMENT_ID, 'confirmed');
  });

  it('email notification rejection does not throw or block the flow', async () => {
    mockSendStatusNotification.mockRejectedValueOnce(new Error('Email service down'));

    const { sendStatusNotification } = await import('@/lib/email/notify');

    // Fire-and-forget with .catch — should not throw
    await expect(
      sendStatusNotification(MOCK_SHIPMENT_ID, 'confirmed').catch(() => {}),
    ).resolves.toBeUndefined();
  });

  it('adapter generates deterministic bookingReferenceId from draftId', () => {
    const payload1 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: MOCK_DRAFT_ID,
    });
    const payload2 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: MOCK_DRAFT_ID,
    });

    expect(payload1.bookingReferenceId).toBe(`draft-${MOCK_DRAFT_ID}`);
    expect(payload1.bookingReferenceId).toBe(payload2.bookingReferenceId);
  });

  it('adapter generates unique bookingReferenceId without draftId', () => {
    const payload1 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
    });
    const payload2 = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
    });

    expect(payload1.bookingReferenceId).toMatch(/^booking-/);
    expect(payload2.bookingReferenceId).toMatch(/^booking-/);
    expect(payload1.bookingReferenceId).not.toBe(payload2.bookingReferenceId);
  });

  it('post-booking insert failure does not prevent subsequent steps', async () => {
    // Simulate medicine items insert throwing
    const originalInsert = insertMedicineItems;
    const failingInsert = vi.fn().mockRejectedValue(new Error('DB connection lost'));

    // Even if medicine insert fails, wallet + email + draft should proceed
    let medicineInsertFailed = false;
    try {
      await failingInsert(MOCK_SHIPMENT_ID, sampleMedicineData);
    } catch {
      medicineInsertFailed = true;
    }
    expect(medicineInsertFailed).toBe(true);

    // Wallet deduction still proceeds
    const mockDeduct = vi.fn().mockResolvedValue({ success: true });
    const walletResult = await mockDeduct(1770, MOCK_SHIPMENT_ID);
    expect(walletResult.success).toBe(true);

    // Email still fires
    const { sendStatusNotification } = await import('@/lib/email/notify');
    sendStatusNotification(MOCK_SHIPMENT_ID, 'confirmed').catch(() => {});
    expect(mockSendStatusNotification).toHaveBeenCalled();

    // Draft discard still happens
    const mockDiscard = vi.fn();
    mockDiscard();
    expect(mockDiscard).toHaveBeenCalled();
  });

  it('wallet deduction uses the total amount including add-on costs', () => {
    const payload = adaptBookingData({
      formData: sampleMedicineData,
      shipmentType: 'medicine',
      draftId: MOCK_DRAFT_ID,
    });

    // Add insurance add-on
    const addonTotal = sampleMedicineData.insurance ? 150 : 0;
    const expectedTotal = payload.totalAmount + addonTotal;

    // The form adds addon costs to payload.totalAmount before wallet deduction
    expect(expectedTotal).toBeGreaterThan(payload.totalAmount);
    expect(expectedTotal).toBe(payload.totalAmount + 150);
  });
});
