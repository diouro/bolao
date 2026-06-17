import { getPoolMemberProfiles } from "@/lib/pools/members";
import type { MentionableUser, Profile } from "@/lib/types";

export async function getMentionableUsers(poolId: string): Promise<MentionableUser[]> {
  const profiles = await getPoolMemberProfiles(poolId);

  return profiles.map((profile) => {
    const label = profile.display_name || profile.email;

    return {
      id: profile.id,
      label,
      handle: getMentionHandle(profile),
      email: profile.email,
      has_paid: profile.has_paid,
    };
  });
}

export function getMentionHandle(profile: Pick<Profile, "display_name" | "email">) {
  const label = profile.display_name || profile.email;
  const emailHandle = profile.email.split("@")[0] || "friend";

  return label.replace(/[^a-zA-Z0-9_]/g, "") || emailHandle;
}
