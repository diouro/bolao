import { CountryFlag } from "@/components/country-flag";
import { PredictionForm } from "@/components/prediction-form";
import { Badge, Card } from "@/components/ui";
import { calculatePoints } from "@/lib/scoring/calculate-points";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import type { MatchWithPrediction } from "@/lib/types";

const roundLabels: Record<string, string> = {
  group: "Group",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  third_place: "Third place",
  final: "Final",
};

export function MatchCard({ match }: { match: MatchWithPrediction }) {
  const home = resolveMatchSide(match, "home");
  const away = resolveMatchSide(match, "away");
  const locked = new Date(match.kickoff_at).getTime() <= new Date().getTime();
  const points = match.prediction
    ? calculatePoints({
        predictionHome: match.prediction.home_score,
        predictionAway: match.prediction.away_score,
        actualHome: match.home_score,
        actualAway: match.away_score,
      })
    : null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Badge>{roundLabels[match.round] ?? match.round}</Badge>
          {match.group_code && <Badge>Group {match.group_code}</Badge>}
        </div>
        <time className="text-sm font-medium text-zinc-500">
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(match.kickoff_at))}
        </time>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide name={home.name} code={home.code} slot={home.slot} />
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-black text-zinc-700">
          {match.home_score === null || match.away_score === null
            ? "vs"
            : `${match.home_score}-${match.away_score}`}
        </div>
        <TeamSide name={away.name} code={away.code} slot={away.slot} align="right" />
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <PredictionForm
          matchId={match.id}
          prediction={match.prediction}
          locked={locked}
        />
        {points && match.status === "finished" && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {points.points} pts
            {points.exact ? " · exact score" : points.result ? " · result hit" : ""}
          </div>
        )}
      </div>
    </Card>
  );
}

function TeamSide({
  name,
  code,
  slot,
  align = "left",
}: {
  name: string;
  code: string | null;
  slot: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex min-w-0 flex-row-reverse items-center gap-3 text-right"
          : "flex min-w-0 items-center gap-3"
      }
    >
      <CountryFlag code={code} slot={slot} />
      <div className="min-w-0">
        <div className="truncate text-base font-bold text-zinc-950">{name}</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {code ?? slot ?? "TBD"}
        </div>
      </div>
    </div>
  );
}
