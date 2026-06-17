import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FixtureNavigation } from "@/components/fixture-navigation";
import { PredictionsFixtureLoading } from "@/components/predictions-fixture-loading";
import { requireProfile } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getMatchesWithUserPredictions } from "@/lib/matches";
import { getDefaultFixtureCategory } from "@/lib/tournament/fixture-categories";
import { PredictionsFixture } from "@/app/(app)/predictions/predictions-fixture";

export const dynamic = "force-dynamic";

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const params = await searchParams;

  if (!params.group) {
    const profile = await requireProfile();
    const matches = await getMatchesWithUserPredictions(profile.id);
    const defaultCategory = getDefaultFixtureCategory(matches);
    redirect(`/predictions?group=${defaultCategory}`);
  }

  const locale = await getLocale();

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "app.predictions")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "predictions.fullList")}
        </h1>
      </div>

      <div className="space-y-6">
        <Suspense fallback={null}>
          <FixtureNavigation locale={locale} />
        </Suspense>
        <Suspense
          key={params.group}
          fallback={<PredictionsFixtureLoading locale={locale} />}
        >
          <PredictionsFixture groupParam={params.group} locale={locale} />
        </Suspense>
      </div>
    </>
  );
}
