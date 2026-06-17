import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { getMatchCommentsForMatches } from "@/lib/comments";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  getFriendPredictionsForMatches,
  getMatchesWithUserPredictions,
} from "@/lib/matches";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import { getMentionableUsers } from "@/lib/profiles";
import { requireAppContext } from "@/lib/pools/context";
import {
  getDefaultFixtureCategory,
  isKnockoutCategory,
  normalizeCategory,
  type FixtureCategory,
  type KnockoutCategory,
} from "@/lib/tournament/fixture-categories";
import type {
  MatchComment,
  MatchFriendPrediction,
  MatchWithPrediction,
  MentionableUser,
} from "@/lib/types";

const roundLabelKeys: Record<KnockoutCategory, TranslationKey> = {
  round_of_32: "round.round_of_32",
  round_of_16: "round.round_of_16",
  quarter_final: "round.quarter_final",
  semi_final: "round.semi_final",
  third_place: "round.third_place",
  final: "round.final",
};

export async function PredictionsFixture({
  groupParam,
  locale,
}: {
  groupParam?: string;
  locale: Locale;
}) {
  const { profile, poolId } = await requireAppContext();
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const selectedCategory = groupParam
    ? normalizeCategory(groupParam)
    : getDefaultFixtureCategory(matches);
  const displayedMatches = isKnockoutCategory(selectedCategory)
    ? matches.filter((match) => match.round === selectedCategory)
    : matches.filter(
        (match) =>
          match.round === "group" && match.group_code === selectedCategory,
      );
  const commentsByMatch = await getMatchCommentsForMatches(
    poolId,
    displayedMatches.map((match) => match.id),
  );
  const mentionableUsers = await getMentionableUsers(poolId);
  const friendPredictionsByMatch = await getFriendPredictionsForMatches(
    poolId,
    displayedMatches.map((match) => match.id),
  );

  if (isKnockoutCategory(selectedCategory)) {
    return (
      <RoundFixture
        round={selectedCategory}
        locale={locale}
        matches={displayedMatches}
        lockMinutes={lockMinutes}
        commentsByMatch={commentsByMatch}
        friendPredictionsByMatch={friendPredictionsByMatch}
        mentionableUsers={mentionableUsers}
        currentUserId={profile.id}
      />
    );
  }

  return (
    <GroupFixture
      group={selectedCategory}
      locale={locale}
      matches={displayedMatches}
      lockMinutes={lockMinutes}
      commentsByMatch={commentsByMatch}
      friendPredictionsByMatch={friendPredictionsByMatch}
      mentionableUsers={mentionableUsers}
      currentUserId={profile.id}
    />
  );
}

function GroupFixture({
  group,
  locale,
  matches,
  lockMinutes,
  commentsByMatch,
  friendPredictionsByMatch,
  mentionableUsers,
  currentUserId,
}: {
  group: FixtureCategory;
  locale: Locale;
  matches: MatchWithPrediction[];
  lockMinutes: number;
  commentsByMatch: Map<string, MatchComment[]>;
  friendPredictionsByMatch: Map<string, MatchFriendPrediction[]>;
  mentionableUsers: MentionableUser[];
  currentUserId: string;
}) {
  return (
    <section>
      <Card className="mb-4 bg-zinc-50/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {t(locale, "common.group")} {group}
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">
              {t(locale, "predictions.fixture")}
            </h2>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            {t(locale, "predictions.matches", { count: matches.length })}
          </div>
        </div>
      </Card>
      <div className="grid gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            lockMinutes={lockMinutes}
            comments={commentsByMatch.get(match.id) ?? []}
            friendPredictions={friendPredictionsByMatch.get(match.id) ?? []}
            mentionableUsers={mentionableUsers}
            currentUserId={currentUserId}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

function RoundFixture({
  round,
  locale,
  matches,
  lockMinutes,
  commentsByMatch,
  friendPredictionsByMatch,
  mentionableUsers,
  currentUserId,
}: {
  round: KnockoutCategory;
  locale: Locale;
  matches: MatchWithPrediction[];
  lockMinutes: number;
  commentsByMatch: Map<string, MatchComment[]>;
  friendPredictionsByMatch: Map<string, MatchFriendPrediction[]>;
  mentionableUsers: MentionableUser[];
  currentUserId: string;
}) {
  return (
    <section>
      <Card className="mb-4 bg-zinc-50/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {t(locale, "predictions.knockout")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">
              {t(locale, roundLabelKeys[round])}
            </h2>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            {t(locale, "predictions.matches", { count: matches.length })}
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          {t(locale, "predictions.slots")}
        </p>
      </Card>
      <div className="grid gap-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            lockMinutes={lockMinutes}
            comments={commentsByMatch.get(match.id) ?? []}
            friendPredictions={friendPredictionsByMatch.get(match.id) ?? []}
            mentionableUsers={mentionableUsers}
            currentUserId={currentUserId}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
