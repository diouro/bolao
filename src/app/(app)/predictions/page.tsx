import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { requireProfile } from "@/lib/auth";
import { getMatchesWithUserPredictions } from "@/lib/matches";
import type { MatchWithPrediction, TournamentRound } from "@/lib/types";

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

export default async function PredictionsPage() {
  const profile = await requireProfile();
  const matches = await getMatchesWithUserPredictions(profile.id);

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

      <div className="space-y-10">
        {roundOrder.map((round) => {
          const roundMatches = matches.filter((match) => match.round === round);

          if (roundMatches.length === 0) {
            return null;
          }

          if (round === "group") {
            return <GroupStage key={round} matches={roundMatches} />;
          }

          return (
            <section key={round}>
              <h2 className="mb-4 text-2xl font-black text-zinc-950">
                {roundLabels[round]}
              </h2>
              <div className="grid gap-4">
                {roundMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function GroupStage({ matches }: { matches: MatchWithPrediction[] }) {
  const groups = Array.from(
    new Set(matches.map((match) => match.group_code).filter(Boolean)),
  ).sort();

  return (
    <section>
      <h2 className="mb-4 text-2xl font-black text-zinc-950">Group stage</h2>
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group}>
            <h3 className="mb-3 text-lg font-bold text-zinc-800">
              Group {group}
            </h3>
            <div className="grid gap-4">
              {matches
                .filter((match) => match.group_code === group)
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
