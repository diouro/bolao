import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "@/lib/env";

export function createSupabaseAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!hasSupabaseEnv() || !serviceRoleKey) {
    throw new Error(
      "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
