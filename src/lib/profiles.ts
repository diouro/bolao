import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MentionableUser, Profile } from "@/lib/types";

export async function getMentionableUsers(): Promise<MentionableUser[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Profile[]).map((profile) => {
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
