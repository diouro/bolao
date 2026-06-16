"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPlatformBaseUrl, getBootstrapAdminEmail } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2).optional().or(z.literal("")),
});

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function loginWithGoogle(formData: FormData) {
  const next = safeNext(getString(formData, "next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getPlatformBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.url) {
    throw new Error("Supabase did not return a Google sign-in URL.");
  }

  redirect(data.url);
}

export async function loginWithEmail(formData: FormData) {
  const values = loginSchema.parse({
    email: getString(formData, "email").toLowerCase(),
    password: getString(formData, "password"),
    next: getString(formData, "next"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(safeNext(values.next));
}

export async function registerWithEmail(formData: FormData) {
  const values = registerSchema.parse({
    email: getString(formData, "email").toLowerCase(),
    password: getString(formData, "password"),
    displayName: getString(formData, "displayName"),
    next: getString(formData, "next"),
  });

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const bootstrapAdminEmail = getBootstrapAdminEmail();
  const role = values.email === bootstrapAdminEmail ? "admin" : "player";

  const { data, error } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.displayName || values.email,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("An account already exists for this email. Sign in instead.");
    }

    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Supabase did not return a user for the new account.");
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    email: values.email,
    display_name: values.displayName || values.email,
    avatar_url: null,
    role,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }

  redirect(safeNext(values.next));
}
