import Link from "next/link";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchCommentsForMatches } from "@/lib/comments";
import { getMatchesForNextMatchDay } from "@/lib/match-day";
import {
  getFriendPredictionsForMatches,
  getMatchesWithUserPredictions,
} from "@/lib/matches";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import { getMentionableUsers } from "@/lib/profiles";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import type {
  MatchComment,
  MatchFriendPrediction,
  MatchWithPrediction,
  MentionableUser,
  TournamentRound,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const knockoutRoundOrder = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const satisfies readonly TournamentRound[];

const roundLabelKeys: Record<TournamentRound, TranslationKey> = {
  group: "round.group",
  round_of_32: "round.round_of_32",
  round_of_16: "round.round_of_16",
  quarter_final: "round.quarter_final",
  semi_final: "round.semi_final",
  third_place: "round.third_place",
  final: "round.final",
};

const groupOrder = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

type GroupCategory = (typeof groupOrder)[number];
type KnockoutCategory = (typeof knockoutRoundOrder)[number];
type FixtureCategory = GroupCategory | KnockoutCategory;

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const locale = await getLocale();
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const selectedCategory = params.group
    ? normalizeCategory(params.group)
    : getDefaultFixtureCategory(matches);
  const displayedMatches = isKnockoutCategory(selectedCategory)
    ? matches.filter((match) => match.round === selectedCategory)
    : matches.filter(
        (match) => match.round === "group" && match.group_code === selectedCategory
      );
  const commentsByMatch = await getMatchCommentsForMatches(
    displayedMatches.map((match) => match.id)
  );
  const mentionableUsers = await getMentionableUsers();
  const friendPredictionsByMatch = await getFriendPredictionsForMatches(
    displayedMatches.map((match) => match.id)
  );

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "app.predictions")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "predictions.fullList")}
        </h1>
      </div>

      <div className="space-y-6">
        <FixtureNavigation selectedCategory={selectedCategory} locale={locale} />
        {isKnockoutCategory(selectedCategory) ? (
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
        ) : (
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
        )}
      </div>
    </>
  );
}

function getDefaultFixtureCategory(
  matches: MatchWithPrediction[],
): FixtureCategory {
  const activeMatches = matches.filter((match) => match.status !== "finished");
  const sameDayMatches = getMatchesForNextMatchDay(activeMatches);

  if (sameDayMatches.length === 0) {
    return "A";
  }

  const groupMatch = sameDayMatches.find(
    (match) => match.round === "group" && match.group_code,
  );

  if (groupMatch?.group_code && groupOrder.includes(groupMatch.group_code as GroupCategory)) {
    return groupMatch.group_code as GroupCategory;
  }

  const knockoutMatch = sameDayMatches.find((match) => match.round !== "group");

  if (knockoutMatch && isKnockoutCategory(knockoutMatch.round)) {
    return knockoutMatch.round;
  }

  return "A";
}

function normalizeCategory(group?: string): FixtureCategory {
  if (group === "knockout") {
    return "round_of_32";
  }

  const normalizedRound = group?.toLowerCase() as KnockoutCategory | undefined;

  if (normalizedRound && knockoutRoundOrder.includes(normalizedRound)) {
    return normalizedRound;
  }

  const normalized = group?.toUpperCase() ?? "A";

  return groupOrder.includes(normalized as GroupCategory)
    ? (normalized as GroupCategory)
    : "A";
}

function isKnockoutCategory(category: FixtureCategory): category is KnockoutCategory {
  return knockoutRoundOrder.includes(category as KnockoutCategory);
}

function FixtureNavigation({
  selectedCategory,
  locale,
}: {
  selectedCategory: FixtureCategory;
  locale: Locale;
}) {
  return (
    <Card className="sticky top-4 z-10 p-3">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1">
        {groupOrder.map((group) => (
          <Link
            key={group}
            href={`/predictions?group=${group}`}
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100",
              selectedCategory === group &&
                "bg-emerald-600 text-white hover:bg-emerald-600"
            )}
          >
            {t(locale, "common.group")} {group}
          </Link>
        ))}
        <div className="mx-1 h-10 w-px shrink-0 bg-zinc-200" />
        {knockoutRoundOrder.map((round) => (
          <Link
            key={round}
            href={`/predictions?group=${round}`}
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100",
              selectedCategory === round &&
                "bg-zinc-950 text-white hover:bg-zinc-950"
            )}
          >
            {t(locale, roundLabelKeys[round])}
          </Link>
        ))}
      </div>
    </Card>
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
  group: string;
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
