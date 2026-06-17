import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PoolMember, PoolMemberProfile, Profile } from "@/lib/types";

export async function getPoolMemberIds(poolId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", poolId)
    .is("left_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Pick<PoolMember, "user_id">[]).map((row) => row.user_id);
}

export async function getPoolMemberProfiles(poolId: string): Promise<PoolMemberProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data: members, error: membersError } = await supabase
    .from("pool_members")
    .select("user_id, role, has_paid, joined_at")
    .eq("pool_id", poolId)
    .is("left_at", null)
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const memberRows = (members ?? []) as Pick<
    PoolMember,
    "user_id" | "role" | "has_paid" | "joined_at"
  >[];

  if (memberRows.length === 0) {
    return [];
  }

  const userIds = memberRows.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profilesById = new Map(
    ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );

  return memberRows
    .map((member) => {
      const profile = profilesById.get(member.user_id);

      if (!profile) {
        return null;
      }

      return {
        ...profile,
        has_paid: member.has_paid,
        pool_role: member.role,
        pool_joined_at: member.joined_at,
      } satisfies PoolMemberProfile;
    })
    .filter((profile): profile is PoolMemberProfile => profile !== null);
}

export async function getPoolMemberHasPaid(poolId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pool_members")
    .select("has_paid")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.has_paid ?? false;
}
