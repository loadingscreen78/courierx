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

// GET /api/admin/customers — all auth users merged with real wallet + shipment data
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();

  try {
    // 1. All auth users (service role)
    const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw authErr;

    // 2. Profiles (KYC data, avatar, phone)
    const { data: profiles } = await supabase.from('profiles').select('*');
    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

    // 3. Wallet ledger — compute real balance and total spend per user
    const { data: ledger } = await supabase
      .from('wallet_ledger')
      .select('user_id, transaction_type, amount');

    const walletMap = new Map<string, { balance: number; total_spent: number }>();
    for (const entry of ledger || []) {
      const w = walletMap.get(entry.user_id) || { balance: 0, total_spent: 0 };
      if (['credit', 'refund', 'release'].includes(entry.transaction_type)) {
        w.balance += Number(entry.amount);
      } else if (['debit', 'hold'].includes(entry.transaction_type)) {
        w.balance -= Number(entry.amount);
        if (entry.transaction_type === 'debit') {
          w.total_spent += Number(entry.amount);
        }
      }
      walletMap.set(entry.user_id, w);
    }

    // 4. Shipment counts and last shipment date
    const { data: shipments } = await supabase
      .from('shipments')
      .select('user_id, created_at');

    const shipCountMap = new Map<string, { count: number; lastAt: string | null }>();
    for (const s of shipments || []) {
      const agg = shipCountMap.get(s.user_id) || { count: 0, lastAt: null };
      agg.count++;
      if (!agg.lastAt || s.created_at > agg.lastAt) agg.lastAt = s.created_at;
      shipCountMap.set(s.user_id, agg);
    }

    // 5. Roles
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap = new Map<string, string[]>();
    for (const r of roles || []) {
      const arr = roleMap.get(r.user_id) || [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    // 6. Build a unified set of user_ids: auth users UNION profile users UNION wallet users UNION shipment users
    // This ensures users deleted from auth but still having data are included
    const allUserIds = new Set<string>();
    authUsers.forEach((u: any) => allUserIds.add(u.id));
    (profiles || []).forEach((p: any) => allUserIds.add(p.user_id));
    walletMap.forEach((_, uid) => allUserIds.add(uid));
    shipCountMap.forEach((_, uid) => allUserIds.add(uid));

    const authUserMap = new Map<string, any>();
    authUsers.forEach((u: any) => authUserMap.set(u.id, u));

    const customers = Array.from(allUserIds).map((uid) => {
      const u = authUserMap.get(uid);
      const profile = profileMap.get(uid);
      const wallet = walletMap.get(uid) || { balance: 0, total_spent: 0 };
      const shipAgg = shipCountMap.get(uid) || { count: 0, lastAt: null };
      return {
        user_id: uid,
        full_name: profile?.full_name || u?.user_metadata?.full_name || u?.user_metadata?.name || null,
        email: profile?.email || u?.email || null,
        phone_number: profile?.phone_number || u?.phone || null,
        wallet_balance: Math.max(0, wallet.balance),
        total_spent: wallet.total_spent,
        aadhaar_verified: profile?.aadhaar_verified || false,
        kyc_completed_at: profile?.kyc_completed_at || null,
        created_at: u?.created_at || profile?.created_at || new Date().toISOString(),
        updated_at: profile?.updated_at || u?.updated_at || u?.created_at || new Date().toISOString(),
        avatar_url: profile?.avatar_url || u?.user_metadata?.avatar_url || null,
        aadhaar_address: profile?.aadhaar_address || null,
        shipment_count: shipAgg.count,
        last_shipment_at: shipAgg.lastAt,
        roles: roleMap.get(uid) || [],
      };
    });

    // 7. Top 10 by total_spent for coupon recommendations
    const top10 = [...customers]
      .filter(c => c.total_spent > 0)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
      .map(c => ({
        user_id: c.user_id,
        full_name: c.full_name,
        email: c.email,
        total_spent: c.total_spent,
        shipment_count: c.shipment_count,
        wallet_balance: c.wallet_balance,
      }));

    return NextResponse.json({ customers, top10 });
  } catch (err) {
    console.error('[admin/customers] error:', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
