import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { updateShipmentStatus } from '@/lib/shipment-lifecycle/stateMachine';
import type { ShipmentStatus } from '@/lib/shipment-lifecycle/types';

const bodySchema = z.object({
  shipmentId: z.string().uuid(),
  action: z.enum(['mark_arrived', 'quality_check', 'package', 'approve_dispatch']),
  expectedVersion: z.number().int().positive(),
  notes: z.string().optional(),
});

const ACTION_TO_STATUS: Record<string, ShipmentStatus> = {
  mark_arrived: 'ARRIVED_AT_WAREHOUSE',
  quality_check: 'QUALITY_CHECKED',
  package: 'PACKAGED',
  approve_dispatch: 'DISPATCH_APPROVED',
};

// Simple in-memory rate limiter: max 10 actions per admin per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }
  if (entry.count >= 10) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth — verify admin session
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

    // 3. Rate limit
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) {
      const retryAfterSec = Math.ceil((rl.retryAfterMs ?? 60_000) / 1000);
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    // 4. Validate body
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.issues,
      }, { status: 400 });
    }

    const { shipmentId, action, expectedVersion, notes } = parsed.data;
    const newStatus = ACTION_TO_STATUS[action];

    // 5. Perform status update via state machine
    const result = await updateShipmentStatus({
      shipmentId,
      newStatus,
      source: 'INTERNAL',
      metadata: {
        action,
        performedBy: user.id,
        ...(notes && { notes }),
      },
      expectedVersion,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status: result.httpStatus ?? 400 }
      );
    }

    return NextResponse.json({ success: true, shipment: result.shipment }, { status: 200 });
  } catch (err) {
    console.error('[admin-action] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
