import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchDomesticRates } from '@/lib/domestic/nimbusPostDomestic';
import { DOMESTIC_LIMITS } from '@/lib/domestic/types';
import type { DomesticShipmentType } from '@/lib/domestic/types';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

const rateCheckSchema = z.object({
  pickupPincode: z.string().regex(/^\d{6}$/, 'Invalid pickup pincode'),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Invalid delivery pincode'),
  weightKg: z.number().positive(),
  lengthCm: z.number().positive(),
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
  declaredValue: z.number().nonnegative().max(49000),
  shipmentType: z.enum(['document', 'gift']),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = getServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = rateCheckSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      }, { status: 400 });
    }

    const data = validation.data;
    const limits = DOMESTIC_LIMITS[data.shipmentType as DomesticShipmentType];

    if (data.weightKg > limits.maxWeightKg) {
      return NextResponse.json({
        success: false,
        error: `Maximum weight for ${data.shipmentType} is ${limits.maxWeightKg} kg`,
      }, { status: 400 });
    }

    // Check if NimbusPost is configured — use mock data if not
    const skipNimbus = !process.env.NIMBUS_EMAIL || !process.env.NIMBUS_PASSWORD;

    if (skipNimbus) {
      // Mock courier options for development
      const mockCouriers = [
        {
          courier_company_id: 1,
          courier_name: 'Delhivery Surface',
          freight_charge: Math.round(40 + data.weightKg * 30),
          customer_price: Math.round((40 + data.weightKg * 30) * 2.6),
          estimated_delivery_days: 5,
          etd: '',
          rating: 4.2,
          rto_charges: 0,
          cod: false,
          pickup_availability: true,
          is_recommended: true,
        },
        {
          courier_company_id: 2,
          courier_name: 'BlueDart Express',
          freight_charge: Math.round(80 + data.weightKg * 50),
          customer_price: Math.round((80 + data.weightKg * 50) * 2.6),
          estimated_delivery_days: 3,
          etd: '',
          rating: 4.5,
          rto_charges: 0,
          cod: false,
          pickup_availability: true,
          is_recommended: false,
        },
        {
          courier_company_id: 3,
          courier_name: 'DTDC Express',
          freight_charge: Math.round(50 + data.weightKg * 35),
          customer_price: Math.round((50 + data.weightKg * 35) * 2.6),
          estimated_delivery_days: 4,
          etd: '',
          rating: 3.8,
          rto_charges: 0,
          cod: false,
          pickup_availability: true,
          is_recommended: false,
        },
        {
          courier_company_id: 4,
          courier_name: 'Ecom Express',
          freight_charge: Math.round(35 + data.weightKg * 28),
          customer_price: Math.round((35 + data.weightKg * 28) * 2.6),
          estimated_delivery_days: 6,
          etd: '',
          rating: 3.5,
          rto_charges: 0,
          cod: false,
          pickup_availability: true,
          is_recommended: false,
        },
      ];

      return NextResponse.json({ success: true, couriers: mockCouriers });
    }

    const couriers = await fetchDomesticRates(data);

    return NextResponse.json({ success: true, couriers });
  } catch (error) {
    console.error('[domestic/rates] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rates. Please try again.' },
      { status: 500 },
    );
  }
}
