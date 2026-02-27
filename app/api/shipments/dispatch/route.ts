import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { dispatchSchema } from '@/lib/shipment-lifecycle/inputValidator';
import { dispatchInternational } from '@/lib/shipment-lifecycle/bookingService';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();

    // 1. Authenticate user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Verify admin role — reject customers with 403
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = (roles || []).map((r) => r.role);
    const isAdmin = userRoles.includes('admin');

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin role required' },
        { status: 403 },
      );
    }

    // 3. Validate body with dispatchSchema
    const body = await request.json();
    const validation = dispatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { shipmentId, expectedVersion } = validation.data;

    // 4. Call dispatchInternational
    const result = await dispatchInternational(shipmentId, expectedVersion);

    // 5. Return appropriate response
    if (!result.success) {
      let status = 400;
      if (result.error?.includes('VERSION_CONFLICT') || result.error?.includes('version')) {
        status = 409;
      } else if (result.error?.includes('Forbidden') || result.error?.includes('COMPLETED')) {
        status = 403;
      }

      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status },
      );
    }

    return NextResponse.json(
      { success: true, shipment: result.shipment },
      { status: 200 },
    );
  } catch (error) {
    console.error('[shipments/dispatch] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
