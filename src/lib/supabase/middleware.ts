import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublicKey,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "@/lib/env";

const protectedPrefixes = [
  "/dashboard",
  "/predictions",
  "/leaderboard",
  "/breakdown",
  "/chat",
  "/stats",
  "/admin",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!hasSupabaseEnv()) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
