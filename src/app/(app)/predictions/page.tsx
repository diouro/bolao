import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchCommentsForMatches } from "@/lib/comments";
import {
  getFriendPredictionsForMatches,
  getMatchesWithUserPredictions,
} from "@/lib/matches";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import { getMentionableUsers } from "@/lib/profiles";
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

const roundLabels: Record<TournamentRound, string> = {
  group: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  third_place: "Third place",
  final: "Final",
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
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const selectedCategory = normalizeCategory(params.group);
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
    <AppShell profile={profile} active="predictions">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Predictions
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Full fixture list
        </h1>
      </div>

      <div className="space-y-6">
        <FixtureNavigation selectedCategory={selectedCategory} />
        {isKnockoutCategory(selectedCategory) ? (
          <RoundFixture
            round={selectedCategory}
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
            matches={displayedMatches}
            lockMinutes={lockMinutes}
            commentsByMatch={commentsByMatch}
            friendPredictionsByMatch={friendPredictionsByMatch}
            mentionableUsers={mentionableUsers}
            currentUserId={profile.id}
          />
        )}
      </div>
    </AppShell>
  );
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
}: {
  selectedCategory: FixtureCategory;
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
            Group {group}
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
            {roundLabels[round]}
          </Link>
        ))}
      </div>
    </Card>
  );
}

function GroupFixture({
  group,
  matches,
  lockMinutes,
  commentsByMatch,
  friendPredictionsByMatch,
  mentionableUsers,
  currentUserId,
}: {
  group: string;
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
              Group {group}
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">Fixture</h2>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            {matches.length} matches
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
          />
        ))}
      </div>
    </section>
  );
}

function RoundFixture({
  round,
  matches,
  lockMinutes,
  commentsByMatch,
  friendPredictionsByMatch,
  mentionableUsers,
  currentUserId,
}: {
  round: KnockoutCategory;
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
              Knockout
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">
              {roundLabels[round]}
            </h2>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            {matches.length} matches
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Slots such as 1A or W R32-1 will show here until the teams are known.
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
          />
        ))}
      </div>
    </section>
  );
}
