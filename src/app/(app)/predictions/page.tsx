import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchesWithUserPredictions } from "@/lib/matches";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import type { MatchWithPrediction, TournamentRound } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const roundOrder: TournamentRound[] = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

const roundLabels: Record<TournamentRound, string> = {
  group: "Group stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  third_place: "Third place",
  final: "Final",
};

const groupOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

type FixtureCategory = (typeof groupOrder)[number] | "knockout";

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
  const groupMatches =
    selectedCategory === "knockout"
      ? []
      : matches.filter(
          (match) =>
            match.round === "group" && match.group_code === selectedCategory,
        );
  const knockoutMatches = matches.filter((match) => match.round !== "group");

  return (
    <AppShell profile={profile} active="predictions">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Predictions
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Full fixture list
        </h1>
        <p className="mt-2 text-zinc-600">
          Group teams use country flags. Knockout rounds show slots such as 1A
          until you update the JSON and re-seed fixtures.
        </p>
      </div>

      <div className="space-y-6">
        <FixtureNavigation selectedCategory={selectedCategory} />
        {selectedCategory === "knockout" ? (
          <KnockoutStage matches={knockoutMatches} lockMinutes={lockMinutes} />
        ) : (
          <GroupFixture
            group={selectedCategory}
            matches={groupMatches}
            lockMinutes={lockMinutes}
          />
        )}
      </div>
    </AppShell>
  );
}

function normalizeCategory(group?: string): FixtureCategory {
  if (group === "knockout") {
    return "knockout";
  }

  const normalized = group?.toUpperCase() ?? "A";

  return groupOrder.includes(normalized) ? normalized : "A";
}

function FixtureNavigation({
  selectedCategory,
}: {
  selectedCategory: FixtureCategory;
}) {
  return (
    <Card className="p-3">
      <div className="flex gap-2 overflow-x-auto">
        {groupOrder.map((group) => (
          <Link
            key={group}
            href={`/predictions?group=${group}`}
            className={cn(
              "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100",
              selectedCategory === group && "bg-emerald-600 text-white hover:bg-emerald-600",
            )}
          >
            Group {group}
          </Link>
        ))}
        <Link
          href="/predictions?group=knockout"
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100",
            selectedCategory === "knockout" &&
              "bg-zinc-950 text-white hover:bg-zinc-950",
          )}
        >
          Knockout
        </Link>
      </div>
    </Card>
  );
}

function GroupFixture({
  group,
  matches,
  lockMinutes,
}: {
  group: string;
  matches: MatchWithPrediction[];
  lockMinutes: number;
}) {
  return (
    <section>
      <Card className="mb-4 bg-zinc-50/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Group {group}
            </p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950">
              Fixture
            </h2>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            {matches.length} matches
          </div>
        </div>
      </Card>
      <div className="grid gap-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} lockMinutes={lockMinutes} />
        ))}
      </div>
    </section>
  );
}

function KnockoutStage({
  matches,
  lockMinutes,
}: {
  matches: MatchWithPrediction[];
  lockMinutes: number;
}) {
  return (
    <section className="space-y-8">
      <Card className="bg-zinc-50/60">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Knockout
        </p>
        <h2 className="mt-1 text-2xl font-black text-zinc-950">
          Bracket fixtures
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Slots such as 1A or W R32-1 can be replaced in the JSON once teams are
          known.
        </p>
      </Card>
      {roundOrder
        .filter((round) => round !== "group")
        .map((round) => {
          const roundMatches = matches.filter((match) => match.round === round);

          if (roundMatches.length === 0) {
            return null;
          }

          return (
            <div key={round}>
              <h3 className="mb-4 text-xl font-black text-zinc-950">
                {roundLabels[round]}
              </h3>
              <div className="grid gap-4">
                {roundMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    lockMinutes={lockMinutes}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </section>
  );
}
