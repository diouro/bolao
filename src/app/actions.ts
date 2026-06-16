"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/signin");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}

export async function setLocale(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? ""));
  const cookieStore = await cookies();

  cookieStore.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
