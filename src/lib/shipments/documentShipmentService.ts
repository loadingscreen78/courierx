import { supabase } from '@/integrations/supabase/client';
import { DocumentBookingData } from '@/views/DocumentBooking';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface CreateDocumentShipmentParams {
  bookingData: DocumentBookingData;
  userId: string;
}

interface CreateDocumentShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  error?: string;
}

export const createDocumentShipment = async ({
  bookingData,
  userId,
}: CreateDocumentShipmentParams): Promise<CreateDocumentShipmentResult> => {
  try {
    const baseAmount = calculateShippingCost(bookingData);
    let totalAmount = baseAmount;
    if (bookingData.insurance) totalAmount += 100;
    if (bookingData.waterproofPackaging) totalAmount += 50;

    const volumetricWeight = (bookingData.length * bookingData.width * bookingData.height) / 5000;
    const chargeableWeight = Math.max(bookingData.weight / 1000, volumetricWeight);

    const trackingNumber = `CRX-DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const originAddressText = `${bookingData.pickupAddress.addressLine1}, ${bookingData.pickupAddress.addressLine2 ? bookingData.pickupAddress.addressLine2 + ', ' : ''}${bookingData.pickupAddress.city}, ${bookingData.pickupAddress.state} - ${bookingData.pickupAddress.pincode}`;
    const destinationAddressText = `${bookingData.consigneeAddress.addressLine1}, ${bookingData.consigneeAddress.addressLine2 ? bookingData.consigneeAddress.addressLine2 + ', ' : ''}${bookingData.consigneeAddress.city}, ${bookingData.consigneeAddress.country} - ${bookingData.consigneeAddress.zipcode}`;

    const { data: shipment, error: shipmentError } = await db
      .from('shipments')
      .insert({
        user_id: userId,
        tracking_number: trackingNumber,
        shipment_type: 'document',
        status: 'draft',
        origin_address: originAddressText,
        destination_address: destinationAddressText,
        recipient_name: bookingData.consigneeAddress.fullName,
        recipient_phone: bookingData.consigneeAddress.phone,
        destination_country: bookingData.consigneeAddress.country,
        weight_kg: chargeableWeight,
        declared_value: 0,
        total_amount: totalAmount,
        pickup_address: bookingData.pickupAddress,
        consignee_address: bookingData.consigneeAddress,
        notes: bookingData.description || null,
      })
      .select()
      .single();

    if (shipmentError) {
      console.error('[DocumentShipmentService] Error creating shipment:', shipmentError);
      throw shipmentError;
    }

    const { error: documentError } = await db
      .from('document_items')
      .insert({
        shipment_id: shipment.id,
        packet_type: bookingData.packetType,
        document_type: bookingData.documentType,
        description: bookingData.description,
        weight_grams: bookingData.weight,
        length_cm: bookingData.length,
        width_cm: bookingData.width,
        height_cm: bookingData.height,
        insurance: bookingData.insurance,
        waterproof_packaging: bookingData.waterproofPackaging,
      });

    if (documentError) {
      console.error('[DocumentShipmentService] Error creating document details:', documentError);
    }

    return {
      success: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
    };
  } catch (error: any) {
    console.error('[DocumentShipmentService] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create document shipment',
    };
  }
};

const calculateShippingCost = (data: DocumentBookingData): number => {
  const weightInKg = data.weight / 1000;
  const volumetricWeight = (data.length * data.width * data.height) / 5000;
  const chargeableWeight = Math.max(weightInKg, volumetricWeight);
  const baseRatePerKg = 500;
  const packetMultiplier: Record<string, number> = {
    'envelope': 1.0,
    'small-packet': 1.2,
    'large-packet': 1.5,
    'tube': 1.3,
  };
  const multiplier = packetMultiplier[data.packetType] || 1.0;
  return Math.ceil(chargeableWeight * baseRatePerKg * multiplier);
};

export const getDocumentShipmentDetails = async (shipmentId: string) => {
  try {
    const { data: shipment, error: shipmentError } = await db
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    const { data: documentDetails, error: documentError } = await db
      .from('document_items')
      .select('*')
      .eq('shipment_id', shipmentId)
      .single();

    if (documentError) {
      console.error('Error fetching document details:', documentError);
    }

    return { success: true, shipment, documentDetails };
  } catch (error: any) {
    console.error('[DocumentShipmentService] Error fetching details:', error);
    return { success: false, error: error.message };
  }
};
