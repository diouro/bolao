"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logout(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/signin");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}
