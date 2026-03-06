import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { bookingRequestSchema } from '@/lib/shipment-lifecycle/inputValidator';
import { checkRateLimit } from '@/lib/shipment-lifecycle/rateLimiter';
import { createBooking, BookingRequest } from '@/lib/shipment-lifecycle/bookingService';

const extendedBookingSchema = bookingRequestSchema.extend({
  cxbcPartnerId: z.string().uuid().optional(),
  source: z.enum(['cxbc', 'customer']).optional(),
});

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

    // Check if user is an approved CXBC partner
    const { data: cxbcPartner } = await supabase
      .from('cxbc_partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    // Verify role: reject admins UNLESS they are also an approved CXBC partner
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = (roles || []).map((r) => r.role);
    const isAdmin = userRoles.includes('admin');

    if (isAdmin && !cxbcPartner) {
      return NextResponse.json(
        { success: false, error: 'Admin users cannot create bookings via this endpoint' },
        { status: 403 },
      );
    }

    // 2. Rate limit check (5/min/user)
    const rateResult = checkRateLimit(user.id, 'booking');
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

    // 3. Validate body with extended booking schema (includes CXBC fields)
    const body = await request.json();
    const validation = extendedBookingSchema.safeParse(body);

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

    const { cxbcPartnerId, source, ...bookingData } = validation.data;

    // 4. Call createBooking
    const result = await createBooking({
      userId: user.id,
      ...(bookingData as BookingRequest),
      ...(cxbcPartnerId && { cxbcPartnerId }),
      ...(source && { source }),
    });

    // 5. Return appropriate response
    if (!result.success) {
      const status =
        result.errorCode === 'RATE_LIMITED' ? 429 :
        result.errorCode === 'NIMBUS_API_FAILURE' ? 502 :
        400;

      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status },
      );
    }

    return NextResponse.json(
      { success: true, shipment: result.shipment },
      { status: 201 },
    );
  } catch (error) {
    console.error('[shipments/book] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
