import { AppShell } from "@/components/app-shell";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const rows = await getLeaderboard();
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
          Exact score: 5 points. Correct result: 2 points. Wrong: 0 points.
        </p>
      </div>

      {current && (
        <Card className="mb-6 bg-emerald-50">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Your position
          </p>
          <div className="mt-2 text-3xl font-black text-zinc-950">
            #{current.rank} · {current.totalPoints} points
          </div>
        </Card>
      )}

      <LeaderboardTable rows={rows} />
    </AppShell>
  );
}
