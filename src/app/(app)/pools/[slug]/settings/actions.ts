"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPoolBySlug } from "@/lib/pools/context";

const memberSchema = z.object({
  poolSlug: z.string().min(1),
  userId: z.string().uuid(),
});

async function requirePoolAdmin(poolSlug: string, userId: string) {
  const pool = await getPoolBySlug(poolSlug);

  if (!pool) {
    throw new Error("Pool not found.");
  }

  const admin = createSupabaseAdminClient();
  const { data: membership, error } = await admin
    .from("pool_members")
    .select("role")
    .eq("pool_id", pool.id)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("You do not have permission to manage this pool.");
  }

  return pool;
}

export async function setPoolMemberPaid(formData: FormData) {
  const profile = await requireProfile();
  const values = memberSchema.extend({ hasPaid: z.coerce.boolean() }).parse({
    poolSlug: formData.get("poolSlug"),
    userId: formData.get("userId"),
    hasPaid: formData.get("hasPaid") === "true",
  });

  const pool = await requirePoolAdmin(values.poolSlug, profile.id);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("pool_members")
    .update({ has_paid: values.hasPaid })
    .eq("pool_id", pool.id)
    .eq("user_id", values.userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/pools/${values.poolSlug}/settings`);
  revalidatePath("/leaderboard");
}

export async function removePoolMember(formData: FormData) {
  const profile = await requireProfile();
  const values = memberSchema.parse({
    poolSlug: formData.get("poolSlug"),
    userId: formData.get("userId"),
  });

  if (values.userId === profile.id) {
    throw new Error("You cannot remove yourself from the pool.");
  }

  const pool = await requirePoolAdmin(values.poolSlug, profile.id);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("pool_members")
    .update({ left_at: new Date().toISOString() })
    .eq("pool_id", pool.id)
    .eq("user_id", values.userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/pools/${values.poolSlug}/settings`);
}
