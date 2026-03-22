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

// GET /api/admin/customers — returns all auth users merged with profiles + shipment aggregates
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();

  try {
    // 1. Get all auth users (service role only)
    const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw authErr;

    // 2. Get all profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

    // 3. Get shipment aggregates
    const { data: shipments } = await supabase.from('shipments').select('user_id, total_amount, created_at');
    const shipAgg = new Map<string, { count: number; total: number; lastAt: string | null }>();
    for (const s of shipments || []) {
      const agg = shipAgg.get(s.user_id) || { count: 0, total: 0, lastAt: null };
      agg.count++;
      agg.total += s.total_amount || 0;
      if (!agg.lastAt || s.created_at > agg.lastAt) agg.lastAt = s.created_at;
      shipAgg.set(s.user_id, agg);
    }

    // 4. Get roles
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap = new Map<string, string[]>();
    for (const r of roles || []) {
      const arr = roleMap.get(r.user_id) || [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    // 5. Merge: auth users as the source of truth, enrich with profile data
    const customers = authUsers.map((u: any) => {
      const profile = profileMap.get(u.id);
      const agg = shipAgg.get(u.id) || { count: 0, total: 0, lastAt: null };
      // Prefer profile data, fall back to auth user metadata
      const fullName = profile?.full_name || u.user_metadata?.full_name || u.user_metadata?.name || null;
      const email = profile?.email || u.email || null;
      const phone = profile?.phone_number || u.phone || null;
      return {
        user_id: u.id,
        full_name: fullName,
        email,
        phone_number: phone,
        wallet_balance: profile?.wallet_balance || 0,
        aadhaar_verified: profile?.aadhaar_verified || false,
        kyc_completed_at: profile?.kyc_completed_at || null,
        created_at: u.created_at,
        updated_at: profile?.updated_at || u.updated_at || u.created_at,
        avatar_url: profile?.avatar_url || u.user_metadata?.avatar_url || null,
        aadhaar_address: profile?.aadhaar_address || null,
        shipment_count: agg.count,
        total_spent: agg.total,
        last_shipment_at: agg.lastAt,
        roles: roleMap.get(u.id) || [],
      };
    });

    return NextResponse.json({ customers });
  } catch (err) {
    console.error('[admin/customers] error:', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
