import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPoolMemberProfiles } from "@/lib/pools/members";
import type { ChatMessage, Match, MatchComment, Profile } from "@/lib/types";
import { getMentionHandle } from "@/lib/profiles";

export type MentionLogItem = {
  id: string;
  source: "chat" | "match_comment";
  body: string;
  created_at: string;
  author_name: string | null;
  author_email: string | null;
  href: string;
  sourceLabel: string;
};

export type MentionSource = MentionLogItem["source"];

type MatchCommentRow = Pick<
  MatchComment,
  "id" | "pool_id" | "match_id" | "user_id" | "body" | "created_at"
>;

export async function getMentionLogs(
  profile: Profile,
  poolId: string,
): Promise<MentionLogItem[]> {
  const handle = getMentionHandle(profile);
  const supabase = await createSupabaseServerClient();
  const [
    { data: chatMessages, error: chatError },
    { data: matchComments, error: commentsError },
  ] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("*")
      .eq("pool_id", poolId)
      .ilike("body", `%@${handle}%`)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("match_comments")
      .select("id, pool_id, match_id, user_id, body, created_at")
      .eq("pool_id", poolId)
      .ilike("body", `%@${handle}%`)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (chatError) {
    throw new Error(chatError.message);
  }

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const mentionRegex = new RegExp(`(^|\\s)@${escapeRegExp(handle)}(?=\\s|$|[,.!?])`, "i");
  const chatRows = ((chatMessages ?? []) as ChatMessage[]).filter((message) =>
    mentionRegex.test(message.body),
  );
  const commentRows = ((matchComments ?? []) as MatchCommentRow[]).filter((comment) =>
    mentionRegex.test(comment.body),
  );
  const clearedMentionKeys = await getClearedMentionKeys(profile.id, poolId);
  const unreadChatRows = chatRows.filter(
    (message) => !clearedMentionKeys.has(getMentionKey("chat", message.id)),
  );
  const unreadCommentRows = commentRows.filter(
    (comment) =>
      !clearedMentionKeys.has(getMentionKey("match_comment", comment.id)),
  );
  const authorIds = Array.from(
    new Set([
      ...unreadChatRows.map((message) => message.user_id),
      ...unreadCommentRows.map((comment) => comment.user_id),
    ]),
  );
  const matchIds = Array.from(
    new Set(unreadCommentRows.map((comment) => comment.match_id)),
  );
  const [authorsById, matchesById] = await Promise.all([
    getProfilesById(poolId, authorIds),
    getMatchesById(matchIds),
  ]);

  return [
    ...unreadChatRows.map((message) => {
      const author = authorsById.get(message.user_id);

      return {
        id: message.id,
        source: "chat" as const,
        body: message.body,
        created_at: message.created_at,
        author_name: author?.display_name ?? null,
        author_email: author?.email ?? null,
        href: `/chat#message-${message.id}`,
        sourceLabel: "Pool chat",
      };
    }),
    ...unreadCommentRows.map((comment) => {
      const author = authorsById.get(comment.user_id);
      const match = matchesById.get(comment.match_id);

      return {
        id: comment.id,
        source: "match_comment" as const,
        body: comment.body,
        created_at: comment.created_at,
        author_name: author?.display_name ?? null,
        author_email: author?.email ?? null,
        href: getMatchCommentHref(comment.match_id, match),
        sourceLabel: getMatchLabel(match),
      };
    }),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function clearMention({
  userId,
  poolId,
  source,
  sourceId,
}: {
  userId: string;
  poolId: string;
  source: MentionSource;
  sourceId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mention_clears").upsert(
    {
      pool_id: poolId,
      user_id: userId,
      source,
      source_id: sourceId,
    },
    {
      onConflict: "pool_id,user_id,source,source_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearMentions({
  userId,
  poolId,
  mentions,
}: {
  userId: string;
  poolId: string;
  mentions: Pick<MentionLogItem, "source" | "id">[];
}) {
  if (mentions.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mention_clears").upsert(
    mentions.map((mention) => ({
      pool_id: poolId,
      user_id: userId,
      source: mention.source,
      source_id: mention.id,
    })),
    {
      onConflict: "pool_id,user_id,source,source_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getClearedMentionKeys(userId: string, poolId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mention_clears")
    .select("source, source_id")
    .eq("pool_id", poolId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    ((data ?? []) as { source: MentionSource; source_id: string }[]).map((clear) =>
      getMentionKey(clear.source, clear.source_id),
    ),
  );
}

function getMentionKey(source: MentionSource, sourceId: string) {
  return `${source}:${sourceId}`;
}

async function getProfilesById(poolId: string, ids: string[]) {
  const profilesById = new Map<string, Profile>();

  if (ids.length === 0) {
    return profilesById;
  }

  const profiles = await getPoolMemberProfiles(poolId);
  profiles.forEach((profile) => {
    if (ids.includes(profile.id)) {
      profilesById.set(profile.id, profile);
    }
  });

  return profilesById;
}

async function getMatchesById(ids: string[]) {
  const matchesById = new Map<string, Match>();

  if (ids.length === 0) {
    return matchesById;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("matches").select("*").in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  ((data ?? []) as Match[]).forEach((match) => {
    matchesById.set(match.id, match);
  });

  return matchesById;
}

function getMatchCommentHref(matchId: string, match?: Match) {
  if (!match) {
    return `/predictions#match-${matchId}`;
  }

  const category = match.round === "group" ? match.group_code ?? "A" : match.round;

  return `/predictions?group=${category}#match-${match.id}`;
}

function getMatchLabel(match?: Match) {
  if (!match) {
    return "Match comment";
  }

  if (match.round === "group" && match.group_code) {
    return `Group ${match.group_code} match`;
  }

  return match.round.replaceAll("_", " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
