import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "@/lib/env";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

export async function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured. Copy .env.example to .env.local.");
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublicKey(), {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware refresh handles it.
        }
      },
    },
  });
}
