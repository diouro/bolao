import type { Locale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMatchTeamsLabel } from "@/lib/tournament/resolve-slots";
import type { ChatMessage, Match, Prediction, Profile } from "@/lib/types";

export type FriendsActivityKind =
  | "prediction"
  | "prediction_updated"
  | "chat"
  | "comment"
  | "joined";

export type FriendsActivityItem = {
  id: string;
  kind: FriendsActivityKind;
  occurredAt: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  context: string | null;
  href: string;
};

type MatchCommentRow = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

const SOURCE_LIMIT = 100;
const PREDICTION_UPDATE_THRESHOLD_MS = 1_000;

export const FRIENDS_ACTIVITY_PAGE_SIZE = 20;

export type FriendsActivityPage = {
  activities: FriendsActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getFriendsActivity(
  excludeUserId?: string,
  options: {
    page?: number;
    pageSize?: number;
    locale?: Locale;
  } = {},
): Promise<FriendsActivityPage> {
  const locale = options.locale ?? "en";
  const pageSize = options.pageSize ?? FRIENDS_ACTIVITY_PAGE_SIZE;
  const requestedPage = options.page ?? 1;
  const supabase = await createSupabaseServerClient();
  let profilesQuery = supabase
    .from("profiles")
    .select("id, display_name, email, created_at");

  if (excludeUserId) {
    profilesQuery = profilesQuery.neq("id", excludeUserId);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const friends = (profiles ?? []) as Profile[];
  const friendIds = friends.map((profile) => profile.id);

  if (friendIds.length === 0) {
    return {
      activities: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
    };
  }

  const [
    { data: predictions, error: predictionsError },
    { data: chatMessages, error: chatError },
    { data: matchComments, error: commentsError },
  ] = await Promise.all([
    supabase
      .from("predictions")
      .select("*")
      .in("user_id", friendIds)
      .order("updated_at", { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from("chat_messages")
      .select("*")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from("match_comments")
      .select("id, match_id, user_id, body, created_at")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(SOURCE_LIMIT),
  ]);

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  if (chatError) {
    throw new Error(chatError.message);
  }

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const profilesById = new Map(friends.map((profile) => [profile.id, profile]));
  const predictionRows = (predictions ?? []) as Prediction[];
  const chatRows = (chatMessages ?? []) as ChatMessage[];
  const commentRows = (matchComments ?? []) as MatchCommentRow[];
  const matchIds = Array.from(
    new Set([
      ...predictionRows.map((prediction) => prediction.match_id),
      ...commentRows.map((comment) => comment.match_id),
    ]),
  );
  const matchesById = await getMatchesById(matchIds);

  const items: FriendsActivityItem[] = [
    ...friends.map((profile) => ({
      id: `joined:${profile.id}`,
      kind: "joined" as const,
      occurredAt: profile.created_at,
      authorId: profile.id,
      authorName: profile.display_name,
      authorEmail: profile.email,
      body: "",
      context: null,
      href: "/leaderboard",
    })),
    ...predictionRows.map((prediction) => {
      const profile = profilesById.get(prediction.user_id);
      const match = matchesById.get(prediction.match_id);
      const isUpdate =
        new Date(prediction.updated_at).getTime() -
          new Date(prediction.created_at).getTime() >
        PREDICTION_UPDATE_THRESHOLD_MS;

      return {
        id: `prediction:${prediction.user_id}:${prediction.match_id}:${prediction.updated_at}`,
        kind: isUpdate ? ("prediction_updated" as const) : ("prediction" as const),
        occurredAt: prediction.updated_at,
        authorId: prediction.user_id,
        authorName: profile?.display_name ?? null,
        authorEmail: profile?.email ?? null,
        body: `${prediction.home_score}-${prediction.away_score}`,
        context: match ? formatMatchTeamsLabel(match, locale) : null,
        href: getPredictionHref(prediction.match_id, match),
      };
    }),
    ...chatRows.map((message) => {
      const profile = profilesById.get(message.user_id);

      return {
        id: `chat:${message.id}`,
        kind: "chat" as const,
        occurredAt: message.created_at,
        authorId: message.user_id,
        authorName: profile?.display_name ?? null,
        authorEmail: profile?.email ?? null,
        body: message.body,
        context: null,
        href: `/chat#message-${message.id}`,
      };
    }),
    ...commentRows.map((comment) => {
      const profile = profilesById.get(comment.user_id);
      const match = matchesById.get(comment.match_id);

      return {
        id: `comment:${comment.id}`,
        kind: "comment" as const,
        occurredAt: comment.created_at,
        authorId: comment.user_id,
        authorName: profile?.display_name ?? null,
        authorEmail: profile?.email ?? null,
        body: comment.body,
        context: match ? formatMatchTeamsLabel(match, locale) : null,
        href: getPredictionHref(comment.match_id, match),
      };
    }),
  ];

  const sortedItems = items.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() -
      new Date(left.occurredAt).getTime(),
  );
  const total = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    activities: sortedItems.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
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
function getPredictionHref(matchId: string, match?: Match) {
  if (!match) {
    return `/predictions#match-${matchId}`;
  }

  const category =
    match.round === "group" ? (match.group_code ?? "A") : match.round;

  return `/predictions?group=${category}#match-${match.id}`;
}
