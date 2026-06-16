import { Check } from "lucide-react";
import type { LeaderboardRow } from "@/lib/leaderboard";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid grid-cols-[64px_1fr_90px_90px] border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 sm:grid-cols-[80px_1fr_120px_120px_120px]">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Points</div>
        <div className="text-right">Exact</div>
        <div className="hidden text-right sm:block">Result hits</div>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-zinc-600">
          No players yet. The table fills as friends sign up.
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={row.profile.id}
            className="grid grid-cols-[64px_1fr_90px_90px] items-center border-b border-zinc-100 px-4 py-4 last:border-b-0 sm:grid-cols-[80px_1fr_120px_120px_120px]"
          >
            <div className="text-lg font-black text-zinc-950">#{row.rank}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate font-semibold text-zinc-950">
                  {row.profile.display_name ?? row.profile.email}
                </div>
                {row.profile.has_paid && (
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                    title="Paid"
                    aria-label="Paid"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <div className="truncate text-sm text-zinc-500">{row.profile.email}</div>
            </div>
            <div className="text-right text-lg font-black text-emerald-700">
              {row.totalPoints}
            </div>
            <div className="text-right font-semibold text-zinc-800">
              {row.exactHits}
            </div>
            <div className="hidden text-right font-semibold text-zinc-800 sm:block">
              {row.resultHits}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
