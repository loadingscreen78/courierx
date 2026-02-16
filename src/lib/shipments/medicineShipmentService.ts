import { supabase } from '@/integrations/supabase/client';
import { Medicine } from '@/components/booking/medicine/MedicineCard';
import { MedicineBookingData } from '@/views/MedicineBooking';
import {
  uploadWithValidation,
  STORAGE_BUCKETS,
  FILE_TYPES,
} from '@/lib/storage/storageService';

export interface CreateMedicineShipmentParams {
  bookingData: MedicineBookingData;
  userId: string;
}

export interface MedicineShipmentResponse {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  error?: string;
}

/**
 * Upload document to Supabase Storage
 */
async function uploadDocument(
  file: File,
  shipmentId: string,
  documentType: string
): Promise<{ path: string; url?: string; error?: string }> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${shipmentId}/${documentType}_${timestamp}_${sanitizedName}`;

    console.log(`[Storage] Uploading ${documentType} to ${STORAGE_BUCKETS.SHIPMENT_DOCUMENTS}/${filePath}`);

    const result = await uploadWithValidation({
      bucket: STORAGE_BUCKETS.SHIPMENT_DOCUMENTS,
      file,
      path: filePath,
      allowedTypes: [...FILE_TYPES.DOCUMENTS],
      maxSizeMB: 10,
    });

    if (!result.success) {
      console.error(`[Storage] Upload failed for ${documentType}:`, result.error);
      return { path: '', error: result.error };
    }

    console.log(`[Storage] ${documentType} uploaded successfully:`, result.path);
    return { path: result.path || filePath, url: result.url };
  } catch (err) {
    console.error('[Storage] Upload exception:', err);
    return { path: '', error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

/**
 * Calculate shipping costs based on medicines and destination
 */
function calculateShippingCosts(medicines: Medicine[], country: string) {
  // Calculate total weight (assuming average 50g per medicine unit)
  const totalWeight = medicines.reduce((sum, med) => {
    return sum + (med.unitCount * 0.05); // 50g = 0.05kg per unit
  }, 0);

  // Calculate declared value
  const declaredValue = medicines.reduce((sum, med) => {
    return sum + (med.unitCount * med.unitPrice);
  }, 0);

  // Base shipping cost calculation (simplified)
  // In production, this would call a rate calculator API
  let baseShippingCost = 1500; // Base ₹1500

  // Add weight-based cost (₹200 per kg)
  baseShippingCost += Math.ceil(totalWeight) * 200;

  // Add destination-based cost
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

  // Calculate GST (18%)
  const gstAmount = baseShippingCost * 0.18;
  const totalAmount = baseShippingCost + gstAmount;

  return {
    weight: totalWeight,
    declaredValue,
    shippingCost: Math.round(baseShippingCost),
    gstAmount: Math.round(gstAmount),
    totalAmount: Math.round(totalAmount),
  };
}

/**
 * Create a medicine shipment with all related data
 */
export async function createMedicineShipment({
  bookingData,
  userId,
}: CreateMedicineShipmentParams): Promise<MedicineShipmentResponse> {
  try {
    console.log('[MedicineShipment] Starting shipment creation for user:', userId);

    // Calculate costs
    const costs = calculateShippingCosts(
      bookingData.medicines,
      bookingData.consigneeAddress.country
    );

    // Add add-on costs
    let totalAmount = costs.totalAmount;
    if (bookingData.insurance) totalAmount += 150;
    if (bookingData.specialPackaging) totalAmount += 300;

    console.log('[MedicineShipment] Total amount to charge:', totalAmount);

    // Format addresses as JSONB
    const pickupAddress = {
      fullName: bookingData.pickupAddress.fullName,
      phone: bookingData.pickupAddress.phone,
      addressLine1: bookingData.pickupAddress.addressLine1,
      addressLine2: bookingData.pickupAddress.addressLine2,
      city: bookingData.pickupAddress.city,
      state: bookingData.pickupAddress.state,
      pincode: bookingData.pickupAddress.pincode,
    };

    const consigneeAddress = {
      fullName: bookingData.consigneeAddress.fullName,
      phone: bookingData.consigneeAddress.phone,
      email: bookingData.consigneeAddress.email,
      addressLine1: bookingData.consigneeAddress.addressLine1,
      addressLine2: bookingData.consigneeAddress.addressLine2,
      city: bookingData.consigneeAddress.city,
      country: bookingData.consigneeAddress.country,
      zipcode: bookingData.consigneeAddress.zipcode,
    };

    // Format addresses as text for legacy columns
    const originAddressText = `${pickupAddress.addressLine1}, ${pickupAddress.addressLine2 ? pickupAddress.addressLine2 + ', ' : ''}${pickupAddress.city}, ${pickupAddress.state} - ${pickupAddress.pincode}`;
    const destinationAddressText = `${consigneeAddress.addressLine1}, ${consigneeAddress.addressLine2 ? consigneeAddress.addressLine2 + ', ' : ''}${consigneeAddress.city}, ${consigneeAddress.country} - ${consigneeAddress.zipcode}`;

    // Create shipment record
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        user_id: userId,
        shipment_type: 'medicine',
        status: 'draft',
        origin_address: originAddressText,
        destination_address: destinationAddressText,
        destination_country: bookingData.consigneeAddress.country,
        recipient_name: bookingData.consigneeAddress.fullName,
        recipient_phone: bookingData.consigneeAddress.phone,
        recipient_email: bookingData.consigneeAddress.email,
        declared_value: costs.declaredValue,
        shipping_cost: costs.shippingCost,
        gst_amount: costs.gstAmount,
        total_amount: totalAmount,
        weight_kg: costs.weight,
        pickup_address: pickupAddress,
        consignee_address: consigneeAddress,
        consignee_passport: bookingData.consigneeAddress.passportNumber,
        consignee_email: bookingData.consigneeAddress.email,
      })
      .select()
      .single();

    if (shipmentError) {
      console.error('[MedicineShipment] Shipment creation error:', shipmentError);
      return { success: false, error: shipmentError.message };
    }

    console.log('[MedicineShipment] Shipment created:', shipment.id);

    // Insert medicine items
    const medicineItems = bookingData.medicines.map((medicine) => ({
      shipment_id: shipment.id,
      medicine_type: medicine.medicineType,
      category: medicine.category,
      form: medicine.form,
      medicine_name: medicine.medicineName,
      unit_count: medicine.unitCount,
      unit_price: medicine.unitPrice,
      daily_dosage: medicine.dailyDosage,
      manufacturer_name: medicine.manufacturerName,
      manufacturer_address: medicine.manufacturerAddress,
      mfg_date: medicine.mfgDate ? medicine.mfgDate.toISOString().split('T')[0] : null,
      batch_no: medicine.batchNo,
      expiry_date: medicine.expiryDate ? medicine.expiryDate.toISOString().split('T')[0] : null,
      hsn_code: medicine.hsnCode,
      is_controlled: medicine.isControlled,
    }));

    const { error: medicineError } = await supabase
      .from('medicine_items')
      .insert(medicineItems);

    if (medicineError) {
      console.error('[MedicineShipment] Medicine items error:', medicineError);
      // Rollback: delete shipment
      await supabase.from('shipments').delete().eq('id', shipment.id);
      return { success: false, error: medicineError.message };
    }

    console.log('[MedicineShipment] Medicine items inserted:', medicineItems.length);

    // Upload documents
    const documentUploads: Array<{
      file: File;
      type: string;
    }> = [];

    if (bookingData.prescription) {
      documentUploads.push({ file: bookingData.prescription, type: 'prescription' });
    }
    if (bookingData.pharmacyBill) {
      documentUploads.push({ file: bookingData.pharmacyBill, type: 'pharmacy_bill' });
    }
    if (bookingData.consigneeId) {
      documentUploads.push({ file: bookingData.consigneeId, type: 'consignee_id' });
    }

    const documentRecords = [];
    for (const { file, type } of documentUploads) {
      const { path, url, error } = await uploadDocument(file, shipment.id, type);
      if (error || !path) {
        console.error(`[MedicineShipment] Document upload error (${type}):`, error);
        // Continue with other uploads
        continue;
      }

      documentRecords.push({
        shipment_id: shipment.id,
        document_type: type,
        file_name: file.name,
        file_path: path,
        file_url: url || null,
        file_size: file.size,
        mime_type: file.type,
      });
    }

    if (documentRecords.length > 0) {
      const { error: docError } = await supabase
        .from('shipment_documents')
        .insert(documentRecords);

      if (docError) {
        console.error('[MedicineShipment] Document records error:', docError);
        // Don't fail the entire shipment for document errors
      } else {
        console.log('[MedicineShipment] Documents uploaded:', documentRecords.length);
      }
    }

    // Insert add-ons
    const addons = [];
    if (bookingData.insurance) {
      addons.push({
        shipment_id: shipment.id,
        addon_type: 'insurance',
        addon_name: 'Shipment Insurance (up to $25,000)',
        addon_cost: 150,
      });
    }
    if (bookingData.specialPackaging) {
      addons.push({
        shipment_id: shipment.id,
        addon_type: 'special_packaging',
        addon_name: 'Temperature-Controlled Packaging',
        addon_cost: 300,
      });
    }

    if (addons.length > 0) {
      const { error: addonError } = await supabase
        .from('shipment_addons')
        .insert(addons);

      if (addonError) {
        console.error('[MedicineShipment] Addons error:', addonError);
        // Don't fail for addon errors
      } else {
        console.log('[MedicineShipment] Addons inserted:', addons.length);
      }
    }

    console.log('[MedicineShipment] Shipment creation completed successfully');

    return {
      success: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
    };
  } catch (error) {
    console.error('[MedicineShipment] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get shipment details with all related data
 */
export async function getMedicineShipmentDetails(shipmentId: string) {
  try {
    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    // Get medicine items
    const { data: medicines, error: medicineError } = await supabase
      .from('medicine_items')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (medicineError) throw medicineError;

    // Get documents
    const { data: documents, error: docError } = await supabase
      .from('shipment_documents')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (docError) throw docError;

    // Get addons
    const { data: addons, error: addonError } = await supabase
      .from('shipment_addons')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (addonError) throw addonError;

    return {
      success: true,
      data: {
        shipment,
        medicines,
        documents,
        addons,
      },
    };
  } catch (error) {
    console.error('[MedicineShipment] Get details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch shipment details',
    };
  }
}
