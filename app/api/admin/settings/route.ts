import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return role ? user : null;
}

export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value, updated_at')
    .eq('key', 'warehouse_address')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, phone, address, city, state, pincode } = body;

  if (!name || !phone || !address || !city || !state || !pincode) {
    return NextResponse.json({ error: 'All warehouse fields are required' }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key: 'warehouse_address',
      value: { name, phone, address, city, state, pincode },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
