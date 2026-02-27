import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
  console.error(
    '[Email] SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder. ' +
    'Email notifications that fetch shipment data will fail. ' +
    'Set it in .env.local from your Supabase project Settings > API > service_role key.'
  );
}

export const supabaseServer = createClient<Database>(supabaseUrl, serviceRoleKey);
