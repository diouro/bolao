import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildUniqueSlug,
  generateInviteCode,
  slugifyPoolName,
} from "@/lib/pools/utils";
import type { Pool } from "@/lib/types";

export async function createPool({
  name,
  userId,
}: {
  name: string;
  userId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const slug = slugifyPoolName(name);
  let inviteCode = generateInviteCode();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidateSlug =
      attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .insert({
        name: name.trim(),
        slug: candidateSlug,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select("*")
      .single();

    if (poolError) {
      if (
        poolError.message.includes("slug") ||
        poolError.message.includes("invite_code")
      ) {
        if (poolError.message.includes("invite_code")) {
          inviteCode = generateInviteCode();
        }
        continue;
      }

      throw new Error(poolError.message);
    }

    if (!pool) {
      throw new Error("Could not create pool.");
    }

    const { error: memberError } = await supabase.from("pool_members").insert({
      pool_id: pool.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      throw new Error(memberError.message);
    }

    return pool as Pool;
  }

  throw new Error("Could not generate a unique pool slug or invite code.");
}

export async function joinPool({
  poolId,
  userId,
}: {
  poolId: string;
  userId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error: insertError } = await supabase.from("pool_members").insert({
    pool_id: poolId,
    user_id: userId,
    role: "member",
  });

  if (!insertError) {
    return;
  }

  if (insertError.code !== "23505") {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("pool_members")
    .update({ left_at: null, role: "member" })
    .eq("pool_id", poolId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function getPoolByInviteCodeAdmin(inviteCode: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("pools")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Pool | null) ?? null;
}

export async function joinPoolByInviteCode({
  inviteCode,
  userId,
}: {
  inviteCode: string;
  userId: string;
}) {
  const pool = await getPoolByInviteCodeAdmin(inviteCode);

  if (!pool) {
    throw new Error("Invalid invite code.");
  }

  await joinPool({ poolId: pool.id, userId });

  return pool;
}

export function getPoolInvitePath(pool: Pick<Pool, "invite_code">) {
  return `/join/${pool.invite_code}`;
}

export function getPoolSettingsPath(pool: Pick<Pool, "slug">) {
  return `/pools/${pool.slug}/settings`;
}

export { slugifyPoolName };
