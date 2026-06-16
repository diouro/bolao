import { StatsCards } from "@/components/stats-cards";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { computeStats } from "@/lib/stats/compute-stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const profile = await requireProfile();
  const locale = await getLocale();
  const summary = await computeStats(profile.id);

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
