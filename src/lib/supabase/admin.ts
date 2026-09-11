import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client: bypasses RLS and can use the auth admin API.
 * Server-only. Returns null if the service key isn't configured.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
