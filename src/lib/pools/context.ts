import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getPoolByInviteCodeAdmin } from "@/lib/pools/crud";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pool, PoolMembership } from "@/lib/types";

export const poolCookieName = "bolao_pool";

export async function getUserPools(userId: string): Promise<PoolMembership[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pool_members")
    .select(
      "role, has_paid, joined_at, left_at, pools(id, name, slug, invite_code, created_by, created_at)",
    )
    .eq("user_id", userId)
    .is("left_at", null)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const poolValue = row.pools as Pool | Pool[] | null;
      const pool = Array.isArray(poolValue) ? poolValue[0] : poolValue;

      if (!pool) {
        return null;
      }

      return {
        pool,
        role: row.role as PoolMembership["role"],
        has_paid: row.has_paid as boolean,
        joined_at: row.joined_at as string,
      } satisfies PoolMembership;
    })
    .filter((membership): membership is PoolMembership => membership !== null);
}

export async function getCurrentPool(
  userId: string,
  memberships?: PoolMembership[],
): Promise<PoolMembership | null> {
  const pools = memberships ?? (await getUserPools(userId));

  if (pools.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(poolCookieName)?.value?.trim();

  if (cookieSlug) {
    const match = pools.find((membership) => membership.pool.slug === cookieSlug);

    if (match) {
      return match;
    }
  }

  const friendsPool = pools.find((membership) => membership.pool.slug === "friends");

  return friendsPool ?? pools[0] ?? null;
}

export async function requireCurrentPool(userId: string) {
  const memberships = await getUserPools(userId);

  if (memberships.length === 0) {
    redirect("/pools/new");
  }

  const current = await getCurrentPool(userId, memberships);

  if (!current) {
    redirect("/pools/new");
  }

  return {
    membership: current,
    pool: current.pool,
    poolId: current.pool.id,
    memberships,
  };
}

export async function requireAppContext() {
  const profile = await requireProfile();
  const { pool, poolId, membership, memberships } = await requireCurrentPool(profile.id);

  return {
    profile,
    pool,
    poolId,
    membership,
    memberships,
  };
}

export async function getPoolByInviteCode(inviteCode: string) {
  return getPoolByInviteCodeAdmin(inviteCode);
}

export async function getPoolBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Pool | null) ?? null;
}
