import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPoolMemberProfiles } from "@/lib/pools/members";
import type { MatchComment, Profile } from "@/lib/types";

export const MATCH_COMMENTS_LIMIT = 25;

type CommentRow = {
  id: string;
  pool_id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export async function getMatchCommentsForMatches(
  poolId: string,
  matchIds: string[],
  perMatchLimit = MATCH_COMMENTS_LIMIT,
) {
  const commentsByMatch = new Map<string, MatchComment[]>();

  if (matchIds.length === 0) {
    return commentsByMatch;
  }

  const supabase = await createSupabaseServerClient();
  const { data: comments, error } = await supabase
    .from("match_comments")
    .select("id, pool_id, match_id, user_id, body, created_at")
    .eq("pool_id", poolId)
    .in("match_id", matchIds)
    .order("created_at", { ascending: false })
    .limit(matchIds.length * perMatchLimit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (comments ?? []) as CommentRow[];
  const profiles = await getPoolMemberProfiles(poolId);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  for (const comment of rows) {
    const existing = commentsByMatch.get(comment.match_id) ?? [];

    if (existing.length >= perMatchLimit) {
      continue;
    }

    const profile = profilesById.get(comment.user_id);
    existing.push({
      ...comment,
      author_name: profile?.display_name ?? null,
      author_email: profile?.email ?? null,
    });
    commentsByMatch.set(comment.match_id, existing);
  }

  commentsByMatch.forEach((matchComments, matchId) => {
    commentsByMatch.set(
      matchId,
      [...matchComments].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    );
  });

  return commentsByMatch;
}
