import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { dispatchInternational } from '@/lib/shipment-lifecycle/bookingService';

const bodySchema = z.object({
  shipmentId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
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

    // 2. Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = (roles ?? []).some((r: any) => ['admin', 'super_admin', 'warehouse_operator'].includes(r.role));
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 3. Validate body
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });
    }

    const { shipmentId, expectedVersion } = parsed.data;

    // 4. Dispatch
    const result = await dispatchInternational(shipmentId, expectedVersion);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, shipment: result.shipment }, { status: 200 });
  } catch (err) {
    console.error('[dispatch] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
