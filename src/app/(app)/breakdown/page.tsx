import { PointsBreakdownTable } from "@/components/points-breakdown-table";
import { Card } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getPointsBreakdown } from "@/lib/points-breakdown";

export const dynamic = "force-dynamic";

export default async function BreakdownPage() {
  const locale = await getLocale();
  const breakdown = await getPointsBreakdown();
  const finishedMatches = breakdown.matches.length;

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "app.breakdown")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "breakdown.title")}
        </h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label={t(locale, "breakdown.finishedMatches")} value={finishedMatches} />
        <Metric label={t(locale, "breakdown.players")} value={breakdown.users.length} />
        <Metric
          label={t(locale, "breakdown.pointsAwarded")}
          value={breakdown.users.reduce(
            (sum, user) => sum + user.totalPoints,
            0
          )}
        />
      </div>

      <PointsBreakdownTable breakdown={breakdown} locale={locale} />
    </>
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
