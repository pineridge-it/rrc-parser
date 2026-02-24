import { createClient } from '@supabase/supabase-js';

export function createDatabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export type Database = ReturnType<typeof createDatabaseClient>;
