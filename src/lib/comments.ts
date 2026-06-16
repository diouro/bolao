import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchComment, Profile } from "@/lib/types";

export const MATCH_COMMENTS_LIMIT = 25;

type CommentRow = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export async function getMatchCommentsForMatches(
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
    .select("id, match_id, user_id, body, created_at")
    .in("match_id", matchIds)
    .order("created_at", { ascending: false })
    .limit(matchIds.length * perMatchLimit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (comments ?? []) as CommentRow[];
  const userIds = Array.from(new Set(rows.map((comment) => comment.user_id)));
  const profilesById = new Map<string, Profile>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    ((profiles ?? []) as Profile[]).forEach((profile) => {
      profilesById.set(profile.id, profile);
    });
  }

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
