import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { adminActionSchema } from '@/lib/shipment-lifecycle/inputValidator';
import { checkRateLimit } from '@/lib/shipment-lifecycle/rateLimiter';
import { updateShipmentStatus } from '@/lib/shipment-lifecycle/stateMachine';
import { ShipmentStatus } from '@/lib/shipment-lifecycle/types';

const ACTION_STATUS_MAP: Record<string, ShipmentStatus> = {
  quality_check: 'QUALITY_CHECKED',
  package: 'PACKAGED',
  approve_dispatch: 'DISPATCH_APPROVED',
};

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

    // 3. Validate body with adminActionSchema
    const body = await request.json();
    const validation = adminActionSchema.safeParse(body);

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

    const { shipmentId, action, expectedVersion } = validation.data;

    // 4. Rate limit check (3/min per action type)
    const rateResult = checkRateLimit(user.id, action);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateResult.retryAfterMs ?? 0) / 1000)),
          },
        },
      );
    }

    // 5. Map action to target status
    const targetStatus = ACTION_STATUS_MAP[action];

    // 6. Call updateShipmentStatus
    const result = await updateShipmentStatus({
      shipmentId,
      newStatus: targetStatus,
      source: 'INTERNAL',
      metadata: { adminUserId: user.id, action },
      expectedVersion,
    });

    // 7. Return appropriate response
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status: result.httpStatus ?? 400 },
      );
    }

    return NextResponse.json(
      { success: true, shipment: result.shipment },
      { status: 200 },
    );
  } catch (error) {
    console.error('[shipments/admin-action] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
