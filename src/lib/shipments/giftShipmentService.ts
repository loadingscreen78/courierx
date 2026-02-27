import { supabase } from '@/integrations/supabase/client';
import {
  uploadWithValidation,
  STORAGE_BUCKETS,
  FILE_TYPES,
} from '@/lib/storage/storageService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface GiftItem {
  id: string;
  itemName: string;
  hsnCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

export interface GiftBookingData {
  items: GiftItem[];
  pickupAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  consigneeAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
    zipcode: string;
  };
  insurance: boolean;
  giftWrapping: boolean;
  passportPhotoPage?: File | null;
  passportAddressPage?: File | null;
}

interface CreateGiftShipmentParams {
  bookingData: GiftBookingData;
  userId: string;
}

interface CreateGiftShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  error?: string;
}

export const createGiftShipment = async ({
  bookingData,
  userId,
}: CreateGiftShipmentParams): Promise<CreateGiftShipmentResult> => {
  try {
    const totalDeclaredValue = bookingData.items.reduce((sum, item) => sum + item.totalValue, 0);

    if (totalDeclaredValue > 25000) {
      return { success: false, error: 'Total value exceeds CSB IV limit of ₹25,000' };
    }

    const baseAmount = calculateShippingCost(bookingData);
    let totalAmount = baseAmount;
    if (bookingData.insurance) totalAmount += 150;
    if (bookingData.giftWrapping) totalAmount += 100;

    const trackingNumber = `CRX-GFT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const originAddressText = `${bookingData.pickupAddress.addressLine1}, ${bookingData.pickupAddress.addressLine2 ? bookingData.pickupAddress.addressLine2 + ', ' : ''}${bookingData.pickupAddress.city}, ${bookingData.pickupAddress.state} - ${bookingData.pickupAddress.pincode}`;
    const destinationAddressText = `${bookingData.consigneeAddress.addressLine1}, ${bookingData.consigneeAddress.addressLine2 ? bookingData.consigneeAddress.addressLine2 + ', ' : ''}${bookingData.consigneeAddress.city}, ${bookingData.consigneeAddress.country} - ${bookingData.consigneeAddress.zipcode}`;

    const { data: shipment, error: shipmentError } = await db
      .from('shipments')
      .insert({
        user_id: userId,
        tracking_number: trackingNumber,
        shipment_type: 'gift',
        status: 'draft',
        origin_address: originAddressText,
        destination_address: destinationAddressText,
        recipient_name: bookingData.consigneeAddress.fullName,
        recipient_phone: bookingData.consigneeAddress.phone,
        destination_country: bookingData.consigneeAddress.country,
        weight_kg: estimateWeight(bookingData.items),
        declared_value: totalDeclaredValue,
        total_amount: totalAmount,
        pickup_address: bookingData.pickupAddress,
        consignee_address: bookingData.consigneeAddress,
        notes: `Gift shipment with ${bookingData.items.length} item(s)`,
      })
      .select()
      .single();

    if (shipmentError) {
      console.error('[GiftShipmentService] Error creating shipment:', shipmentError);
      throw shipmentError;
    }

    const giftItemsToInsert = bookingData.items.map(item => ({
      shipment_id: shipment.id,
      item_name: item.itemName,
      hsn_code: item.hsnCode,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_value: item.totalValue,
      insurance: bookingData.insurance,
      gift_wrapping: bookingData.giftWrapping,
    }));

    const { error: itemsError } = await db
      .from('gift_items')
      .insert(giftItemsToInsert);

    if (itemsError) {
      console.error('[GiftShipmentService] Error creating gift items:', itemsError);
    }

    const passportUploads: Array<{ file: File; type: string }> = [];
    if (bookingData.passportPhotoPage) {
      passportUploads.push({ file: bookingData.passportPhotoPage, type: 'passport_photo_page' });
    }
    if (bookingData.passportAddressPage) {
      passportUploads.push({ file: bookingData.passportAddressPage, type: 'passport_address_page' });
    }

    for (const { file, type } of passportUploads) {
      try {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${shipment.id}/${type}_${timestamp}_${sanitizedName}`;

        const result = await uploadWithValidation({
          bucket: STORAGE_BUCKETS.PASSPORT_DOCUMENTS,
          file,
          path: filePath,
          allowedTypes: [...FILE_TYPES.DOCUMENTS],
          maxSizeMB: 5,
        });

        if (result.success) {
          await db
            .from('shipment_documents')
            .insert({
              shipment_id: shipment.id,
              document_type: type,
              file_name: file.name,
              file_path: result.path || filePath,
              file_url: result.url || null,
              file_size: file.size,
              mime_type: file.type,
            });
        } else {
          console.error(`[GiftShipmentService] ${type} upload failed:`, result.error);
        }
      } catch (uploadErr) {
        console.error(`[GiftShipmentService] ${type} upload exception:`, uploadErr);
      }
    }

    return {
      success: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
    };
  } catch (error: any) {
    console.error('[GiftShipmentService] Error:', error);
    return { success: false, error: error.message || 'Failed to create gift shipment' };
  }
};

const calculateShippingCost = (data: GiftBookingData): number => {
  const itemCount = data.items.length;
  const isGCC = data.consigneeAddress.country === 'AE' || data.consigneeAddress.country === 'SA';
  const basePrice = isGCC ? 1450 : 1850;
  const extraItemsCost = itemCount > 3 ? (itemCount - 3) * 100 : 0;
  return basePrice + extraItemsCost;
};

const estimateWeight = (items: GiftItem[]): number => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return totalQuantity * 0.5;
};

export const getGiftShipmentDetails = async (shipmentId: string) => {
  try {
    const { data: shipment, error: shipmentError } = await db
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    const { data: giftItems, error: itemsError } = await db
      .from('gift_items')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (itemsError) {
      console.error('Error fetching gift items:', itemsError);
    }

    return { success: true, shipment, giftItems };
  } catch (error: any) {
    console.error('[GiftShipmentService] Error fetching details:', error);
    return { success: false, error: error.message };
  }
};
