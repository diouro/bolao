import type { CookieOptions } from "@supabase/ssr";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export function getSupabaseCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
