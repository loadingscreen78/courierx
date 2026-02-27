/**
 * Post-booking service — handles type-specific data insertion after the
 * lifecycle API creates a shipment.
 *
 * Each function takes a shipmentId and the relevant form data, inserts into
 * the corresponding table. Errors are caught and logged but NOT thrown — the
 * caller decides how to surface warnings.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  uploadWithValidation,
  STORAGE_BUCKETS,
  FILE_TYPES,
} from '@/lib/storage/storageService';
import type { MedicineBookingData } from '@/views/MedicineBooking';
import type { DocumentBookingData } from '@/views/DocumentBooking';
import type { GiftBookingData } from '@/views/GiftBooking';

// ---------------------------------------------------------------------------
// Medicine items
// ---------------------------------------------------------------------------

/**
 * Insert medicine item rows for a lifecycle-created shipment.
 * One row per medicine in `data.medicines`.
 */
export async function insertMedicineItems(
  shipmentId: string,
  data: MedicineBookingData,
): Promise<void> {
  try {
    const rows = data.medicines.map((med) => ({
      shipment_id: shipmentId,
      medicine_type: med.medicineType,
      category: med.category,
      form: med.form,
      medicine_name: med.medicineName,
      unit_count: med.unitCount,
      unit_price: med.unitPrice,
      daily_dosage: med.dailyDosage,
      manufacturer_name: med.manufacturerName,
      manufacturer_address: med.manufacturerAddress,
      mfg_date: med.mfgDate ? med.mfgDate.toISOString().split('T')[0] : null,
      batch_no: med.batchNo,
      expiry_date: med.expiryDate ? med.expiryDate.toISOString().split('T')[0] : null,
      hsn_code: med.hsnCode,
      is_controlled: med.isControlled,
    }));

    const { error } = await (supabase as any)
      .from('medicine_items')
      .insert(rows);

    if (error) {
      console.error('[PostBookingService] medicine_items insert error:', error);
    }
  } catch (err) {
    console.error('[PostBookingService] insertMedicineItems exception:', err);
  }
}


// ---------------------------------------------------------------------------
// Document items
// ---------------------------------------------------------------------------

/**
 * Insert a single document_items row for a lifecycle-created shipment.
 */
export async function insertDocumentItems(
  shipmentId: string,
  data: DocumentBookingData,
): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('document_items')
      .insert({
        shipment_id: shipmentId,
        packet_type: data.packetType,
        document_type: data.documentType,
        description: data.description,
        weight_grams: data.weight,
        length_cm: data.length,
        width_cm: data.width,
        height_cm: data.height,
        insurance: data.insurance,
        waterproof_packaging: data.waterproofPackaging,
      });

    if (error) {
      console.error('[PostBookingService] document_items insert error:', error);
    }
  } catch (err) {
    console.error('[PostBookingService] insertDocumentItems exception:', err);
  }
}

// ---------------------------------------------------------------------------
// Gift items
// ---------------------------------------------------------------------------

/**
 * Insert gift item rows for a lifecycle-created shipment.
 * One row per item in `data.items`.
 */
export async function insertGiftItems(
  shipmentId: string,
  data: GiftBookingData,
): Promise<void> {
  try {
    const rows = data.items.map((item) => ({
      shipment_id: shipmentId,
      item_name: item.name,
      hsn_code: item.hsnCode,
      description: item.description,
      quantity: item.units,
      unit_price: item.unitPrice,
      total_value: item.units * item.unitPrice,
      insurance: data.insurance,
      gift_wrapping: data.giftWrapping,
    }));

    const { error } = await (supabase as any)
      .from('gift_items')
      .insert(rows);

    if (error) {
      console.error('[PostBookingService] gift_items insert error:', error);
    }
  } catch (err) {
    console.error('[PostBookingService] insertGiftItems exception:', err);
  }
}

// ---------------------------------------------------------------------------
// Document uploads
// ---------------------------------------------------------------------------

/**
 * Upload files to Supabase Storage and insert records into
 * shipment_documents. Each upload is independent — a single failure does
 * not block the remaining uploads.
 */
export async function uploadShipmentDocuments(
  shipmentId: string,
  files: Array<{ file: File; type: string }>,
): Promise<void> {
  for (const { file, type } of files) {
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${shipmentId}/${type}_${timestamp}_${sanitizedName}`;

      const result = await uploadWithValidation({
        bucket: STORAGE_BUCKETS.SHIPMENT_DOCUMENTS,
        file,
        path: filePath,
        allowedTypes: [...FILE_TYPES.DOCUMENTS],
        maxSizeMB: 10,
      });

      if (!result.success) {
        console.error(`[PostBookingService] upload failed (${type}):`, result.error);
        continue;
      }

      const { error } = await supabase
        .from('shipment_documents')
        .insert({
          shipment_id: shipmentId,
          document_type: type,
          file_url: result.url || result.path || filePath,
        });

      if (error) {
        console.error(`[PostBookingService] shipment_documents insert error (${type}):`, error);
      }
    } catch (err) {
      console.error(`[PostBookingService] uploadShipmentDocuments exception (${type}):`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------------------

/**
 * Insert add-on records into shipment_addons.
 */
export async function insertAddons(
  shipmentId: string,
  addons: Array<{ type: string; name: string; cost: number }>,
): Promise<void> {
  if (addons.length === 0) return;

  try {
    const rows = addons.map((addon) => ({
      shipment_id: shipmentId,
      addon_type: addon.type,
      addon_name: addon.name,
      addon_cost: addon.cost,
    }));

    const { error } = await (supabase as any)
      .from('shipment_addons')
      .insert(rows);

    if (error) {
      console.error('[PostBookingService] shipment_addons insert error:', error);
    }
  } catch (err) {
    console.error('[PostBookingService] insertAddons exception:', err);
  }
}
