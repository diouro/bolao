import { LeaderboardTable } from "@/components/leaderboard-table";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const locale = await getLocale();
  const leaderboard = await getLeaderboard();
  const { rows, paidPlayers, prizePoolDollars } = leaderboard;
  const current = rows.find((row) => row.profile.id === profile.id);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "app.leaderboard")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "leaderboard.friendRanking")}
        </h1>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {current && (
          <Card className="bg-emerald-50">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t(locale, "leaderboard.position")}
            </p>
            <div className="mt-2 text-3xl font-black text-zinc-950">
              #{current.rank} · {current.totalPoints} {t(locale, "common.points")}
            </div>
          </Card>
        )}
        <Card className="bg-zinc-950 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            {t(locale, "leaderboard.prizePool")}
          </p>
          <div className="mt-2 text-4xl font-black">${prizePoolDollars}</div>
          <p className="mt-2 text-sm text-zinc-300">
            {t(locale, "leaderboard.paidFriends", {
              count: paidPlayers,
              plural: paidPlayers === 1 ? "" : "s",
            })}
          </p>
        </Card>
      </div>

      <LeaderboardTable rows={rows} locale={locale} />
    </>
  );
}
