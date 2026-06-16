import { AppShell } from "@/components/app-shell";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const leaderboard = await getLeaderboard();
  const { rows, paidPlayers, prizePoolDollars } = leaderboard;
  const current = rows.find((row) => row.profile.id === profile.id);

  return (
    <AppShell profile={profile} active="leaderboard">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Leaderboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Friend ranking
        </h1>
        <p className="mt-2 text-zinc-600">
          Exact score: 3 points. Correct outcome only: 1 point. Wrong: 0
          points.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {current && (
          <Card className="bg-emerald-50">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Your position
            </p>
            <div className="mt-2 text-3xl font-black text-zinc-950">
              #{current.rank} · {current.totalPoints} points
            </div>
          </Card>
        )}
        <Card className="bg-zinc-950 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Prize pool
          </p>
          <div className="mt-2 text-4xl font-black">${prizePoolDollars}</div>
          <p className="mt-2 text-sm text-zinc-300">
            {paidPlayers} paid friend{paidPlayers === 1 ? "" : "s"} · $5 each
          </p>
        </Card>
      </div>

      <LeaderboardTable rows={rows} />
    </AppShell>
  );
}
