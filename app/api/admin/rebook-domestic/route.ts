import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { createDomesticShipment, fetchDomesticRates } from '@/lib/domestic/nimbusPostDomestic';

const DEFAULT_WAREHOUSE = {
  name: 'CourierX Warehouse',
  phone: '9999999999',
  address: 'Gopalpur',
  city: 'Cuttack',
  state: 'Odisha',
  pincode: '753011',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // Admin auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = (roles || []).some((r) => r.role === 'admin');
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { shipmentId } = await request.json();
    if (!shipmentId) {
      return NextResponse.json({ success: false, error: 'shipmentId required' }, { status: 400 });
    }

    // Fetch shipment
    const { data: shipment, error: fetchError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (fetchError || !shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.domestic_awb) {
      return NextResponse.json({ success: false, error: 'Shipment already has a domestic AWB: ' + shipment.domestic_awb }, { status: 400 });
    }

    const pickup = shipment.pickup_address;
    if (!pickup?.pincode) {
      return NextResponse.json({ success: false, error: 'No pickup_address on shipment' }, { status: 400 });
    }

    // Get warehouse from settings
    const { data: settingsRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'warehouse_address')
      .maybeSingle();
    const warehouse = settingsRow?.value ?? DEFAULT_WAREHOUSE;

    // Get best courier
    let courierId = 1;
    try {
      const rates = await fetchDomesticRates({
        pickupPincode: pickup.pincode,
        deliveryPincode: warehouse.pincode,
        weightKg: shipment.weight_kg || 0.5,
        declaredValue: shipment.declared_value || 1,
        lengthCm: 10, widthCm: 10, heightCm: 5,
        shipmentType: 'document',
      });
      if (rates.length > 0) courierId = rates[0].courier_company_id;
    } catch (e) {
      console.warn('[rebook-domestic] Serviceability failed, using default courier:', e);
    }

    const pickupAddress = `${pickup.addressLine1}${pickup.addressLine2 ? ' ' + pickup.addressLine2 : ''}`;

    const result = await createDomesticShipment({
      courier_id: courierId,
      pickup: {
        name: pickup.fullName,
        phone: pickup.phone,
        address: pickupAddress,
        city: pickup.city,
        state: pickup.state,
        pincode: pickup.pincode,
      },
      delivery: {
        name: warehouse.name,
        phone: warehouse.phone,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
      },
      order_amount: shipment.declared_value || 1,
      weight: shipment.weight_kg || 0.5,
      length: 10, breadth: 10, height: 5,
      payment_type: 'prepaid',
      content_description: `${shipment.shipment_type} shipment`,
    });

    if (!result.success || !result.awb) {
      return NextResponse.json({ success: false, error: result.error || 'Nimbus booking failed' }, { status: 502 });
    }
    // Save AWB to shipment
    await supabase
      .from('shipments')
      .update({
        domestic_awb: result.awb,
        ...(result.label_url && { domestic_label_url: result.label_url }),
      })
      .eq('id', shipmentId);

    return NextResponse.json({ success: true, awb: result.awb, label_url: result.label_url });
  } catch (error) {
    console.error('[rebook-domestic] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
