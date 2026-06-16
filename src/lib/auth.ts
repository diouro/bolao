import { redirect } from "next/navigation";
import { getBootstrapAdminEmail, getSupabaseServiceRoleKey } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}

export async function requireProfile() {
  await requireUser();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return maybePromoteBootstrapAdmin(profile);
}

export async function requireAdmin() {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}

async function maybePromoteBootstrapAdmin(profile: Profile) {
  const bootstrapEmail = getBootstrapAdminEmail();

  if (
    !bootstrapEmail ||
    profile.role === "admin" ||
    profile.email.toLowerCase() !== bootstrapEmail ||
    !getSupabaseServiceRoleKey()
  ) {
    return profile;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}
