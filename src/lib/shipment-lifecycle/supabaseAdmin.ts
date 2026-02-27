import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let client: SupabaseClient<Database> | null = null;

/**
 * Returns a Supabase client authenticated with the service role key.
 * Used exclusively by server-side shipment lifecycle code (state machine,
 * booking service, cron handlers). Never import from client-side code.
 *
 * The SUPABASE_SERVICE_ROLE_KEY env var is NOT prefixed with NEXT_PUBLIC_
 * to ensure it is never bundled into client builds.
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[shipment-lifecycle] NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to your .env.local file.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      '[shipment-lifecycle] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to your .env.local from Supabase project Settings > API > service_role key.'
    );
  }

  client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
