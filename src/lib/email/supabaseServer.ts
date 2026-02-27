import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[Email] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _client = createClient(supabaseUrl, serviceRoleKey) as any;
  return _client!;
}

// Keep backward-compat export as a getter proxy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseServer: any = new Proxy({} as any, {
  get(_target, prop) {
    return (getSupabaseServer() as any)[prop];
  },
});
