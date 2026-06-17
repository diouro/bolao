import { StatsCards } from "@/components/stats-cards";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { requireAppContext } from "@/lib/pools/context";
import { computeStats } from "@/lib/stats/compute-stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { profile, poolId } = await requireAppContext();
  const locale = await getLocale();
  const summary = await computeStats(profile.id, poolId);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "stats.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "stats.title")}
        </h1>
      </div>

      <StatsCards summary={summary} locale={locale} />
    </>
  );
}
