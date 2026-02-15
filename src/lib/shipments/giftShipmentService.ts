import { supabase } from '@/integrations/supabase/client';

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
    console.log('[GiftShipmentService] Creating gift shipment...');

    // Calculate total declared value
    const totalDeclaredValue = bookingData.items.reduce((sum, item) => sum + item.totalValue, 0);

    // Check CSB IV limit (₹25,000)
    if (totalDeclaredValue > 25000) {
      return {
        success: false,
        error: 'Total value exceeds CSB IV limit of ₹25,000',
      };
    }

    // Calculate shipping cost
    const baseAmount = calculateShippingCost(bookingData);
    let totalAmount = baseAmount;
    
    // Add-ons
    if (bookingData.insurance) totalAmount += 150;
    if (bookingData.giftWrapping) totalAmount += 100;

    // Generate tracking number
    const trackingNumber = `CRX-GFT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Format addresses as text for required columns
    const originAddressText = `${bookingData.pickupAddress.addressLine1}, ${bookingData.pickupAddress.addressLine2 ? bookingData.pickupAddress.addressLine2 + ', ' : ''}${bookingData.pickupAddress.city}, ${bookingData.pickupAddress.state} - ${bookingData.pickupAddress.pincode}`;
    const destinationAddressText = `${bookingData.consigneeAddress.addressLine1}, ${bookingData.consigneeAddress.addressLine2 ? bookingData.consigneeAddress.addressLine2 + ', ' : ''}${bookingData.consigneeAddress.city}, ${bookingData.consigneeAddress.country} - ${bookingData.consigneeAddress.zipcode}`;

    // Create shipment record
    const { data: shipment, error: shipmentError } = await supabase
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

    console.log('[GiftShipmentService] Shipment created:', shipment.id);

    // Create gift items records
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

    const { error: itemsError } = await supabase
      .from('gift_items')
      .insert(giftItemsToInsert);

    if (itemsError) {
      console.error('[GiftShipmentService] Error creating gift items:', itemsError);
      // Don't fail the whole operation, just log the error
    }

    return {
      success: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
    };
  } catch (error: any) {
    console.error('[GiftShipmentService] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create gift shipment',
    };
  }
};

// Calculate shipping cost based on value and destination
const calculateShippingCost = (data: GiftBookingData): number => {
  const itemCount = data.items.length;
  const country = data.consigneeAddress.country;
  
  // Check if GCC country (UAE, Saudi Arabia)
  const isGCC = country === 'AE' || country === 'SA';
  
  // Base price
  const basePrice = isGCC ? 1450 : 1850;
  
  // Add extra cost for more than 3 items
  const extraItemsCost = itemCount > 3 ? (itemCount - 3) * 100 : 0;
  
  return basePrice + extraItemsCost;
};

// Estimate weight based on items (simplified)
const estimateWeight = (items: GiftItem[]): number => {
  // Assume average 0.5kg per item
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return totalQuantity * 0.5;
};

export const getGiftShipmentDetails = async (shipmentId: string) => {
  try {
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    const { data: giftItems, error: itemsError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('shipment_id', shipmentId);

    if (itemsError) {
      console.error('Error fetching gift items:', itemsError);
    }

    return {
      success: true,
      shipment,
      giftItems,
    };
  } catch (error: any) {
    console.error('[GiftShipmentService] Error fetching details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
