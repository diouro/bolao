import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchesWithUserPredictions } from "@/lib/matches";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const nowMs = new Date().getTime();
  const upcoming = matches
    .filter((match) => new Date(match.kickoff_at).getTime() > nowMs)
    .slice(0, 8);
  const missingPicks = matches.filter(
    (match) =>
      new Date(match.kickoff_at).getTime() > nowMs && !match.prediction,
  ).length;

  return (
    <AppShell profile={profile} active="dashboard">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Your next predictions
        </h1>
        <p className="mt-2 text-zinc-600">
          Predict scores before the lock window closes. Results and points
          appear after admins enter final scores.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Upcoming matches" value={upcoming.length} />
        <Metric label="Missing picks" value={missingPicks} />
        <Metric
          label="Picks made"
          value={matches.filter((match) => match.prediction).length}
        />
      </div>

      <div className="grid gap-4">
        {upcoming.length > 0 ? (
          upcoming.map((match) => (
            <MatchCard key={match.id} match={match} lockMinutes={lockMinutes} />
          ))
        ) : (
          <Card>
            <p className="font-semibold text-zinc-950">No upcoming matches.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Once fixtures are seeded, upcoming matches will appear here.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-black text-zinc-950">{value}</div>
      <div className="mt-1 text-sm font-medium text-zinc-500">{label}</div>
    </Card>
  );
}
