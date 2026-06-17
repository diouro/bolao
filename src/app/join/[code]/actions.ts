"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { joinPoolByInviteCode } from "@/lib/pools/crud";
import { poolCookieName } from "@/lib/pools/context";

export async function joinPoolAction(inviteCode: string) {
  const profile = await requireProfile();
  const pool = await joinPoolByInviteCode({
    inviteCode,
    userId: profile.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(poolCookieName, pool.slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/dashboard");
}
