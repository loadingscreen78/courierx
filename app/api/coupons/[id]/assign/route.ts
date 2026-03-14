import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((r: any) => r.role === 'admin')) return null;
  return user;
}

// GET /api/coupons/[id]/assign - List assigned users
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('coupon_user_assignments')
    .select('id, user_id, assigned_at')
    .eq('coupon_id', params.id)
    .order('assigned_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });

  // Enrich with profile data
  const userIds = data?.map((a: any) => a.user_id) || [];
  let profiles: any[] = [];
  if (userIds.length > 0) {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', userIds);
    profiles = p || [];
  }

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
  const enriched = data?.map((a: any) => ({ ...a, profile: profileMap[a.user_id] || null }));

  return NextResponse.json({ assignments: enriched });
}

// POST /api/coupons/[id]/assign - Assign coupon to a user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('coupon_user_assignments')
    .insert({ coupon_id: params.id, user_id, assigned_by: admin.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'User already assigned' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to assign user' }, { status: 500 });
  }

  return NextResponse.json({ assignment: data }, { status: 201 });
}

// DELETE /api/coupons/[id]/assign - Unassign a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

  const { error } = await supabase
    .from('coupon_user_assignments')
    .delete()
    .eq('coupon_id', params.id)
    .eq('user_id', user_id);

  if (error) return NextResponse.json({ error: 'Failed to unassign user' }, { status: 500 });
  return NextResponse.json({ success: true });
}
