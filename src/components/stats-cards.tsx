import { Card } from "@/components/ui";
import { t, type Locale } from "@/lib/i18n";
import type { StatsSummary, UserStats } from "@/lib/stats/compute-stats";

export function StatsCards({
  summary,
  locale,
}: {
  summary: StatsSummary;
  locale: Locale;
}) {
  const current = summary.currentUser;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t(locale, "stats.accuracy")} value={`${current?.accuracy ?? 0}%`} />
        <StatCard label={t(locale, "stats.exactHits")} value={current?.exactHits ?? 0} />
        <StatCard label={t(locale, "stats.streak")} value={current?.bestStreak ?? 0} />
        <StatCard label={t(locale, "stats.boldPicks")} value={current?.boldPicks ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Spotlight title="Most exact scores" user={summary.mostExact} metric="exactHits" locale={locale} />
        <Spotlight title="Hottest streak" user={summary.hottestStreak} metric="bestStreak" locale={locale} />
        <Spotlight title="Boldest picks" user={summary.boldest} metric="boldPicks" locale={locale} />
      </div>

      {current && (
        <Card>
          <h2 className="text-xl font-black text-zinc-950">Your score profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="Correct results" value={current.resultHits} />
            <Mini label="Head-to-head points" value={current.headToHeadPoints} />
            <Mini label="Current streak" value={current.currentStreak} />
            <Mini
              label="Avg predicted goals"
              value={current.averagePredictedGoals.toFixed(1)}
            />
            <Mini
              label="Avg actual goals"
              value={current.averageActualGoals.toFixed(1)}
            />
            <Mini label="Best round" value={current.bestRound ?? "TBD"} />
            <Mini label="Finished picks" value={current.predictions} />
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-black text-zinc-950">{value}</div>
      <div className="mt-1 text-sm font-medium text-zinc-500">{label}</div>
    </Card>
  );
}

function Spotlight({
  title,
  user,
  metric,
  locale,
}: {
  title: string;
  user: UserStats | null;
  metric: keyof Pick<UserStats, "exactHits" | "bestStreak" | "boldPicks">;
  locale: Locale;
}) {
  return (
    <Card className="bg-zinc-950 text-white">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
        {title}
      </p>
      <div className="mt-3 text-2xl font-black">
        {user ? user.profile.display_name ?? user.profile.email : t(locale, "stats.noOne")}
      </div>
      <div className="mt-2 text-sm text-zinc-300">
        {user
          ? `${user[metric]} ${t(locale, "stats.hits")}`
          : t(locale, "stats.afterResults")}
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <div className="text-lg font-black text-zinc-950">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}
