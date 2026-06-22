import type { ReactNode } from "react";
import { GroupStandingsTable } from "@/components/group-standings-table";
import { getAllMatches } from "@/lib/matches";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { computeGroupStandings } from "@/lib/tournament/group-standings";
import { getTeams } from "@/lib/tournament/load-fixtures";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const locale = await getLocale();
  const matches = await getAllMatches();
  const teams = getTeams();
  const standings = computeGroupStandings(matches, teams);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "groups.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "groups.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          {t(locale, "groups.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-600">
        <LegendSwatch className="bg-emerald-50 ring-emerald-200">
          {t(locale, "groups.qualified")}
        </LegendSwatch>
        <LegendSwatch className="bg-amber-50 ring-amber-200">
          {t(locale, "groups.thirdPlace")}
        </LegendSwatch>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {standings.map((groupStandings) => (
          <GroupStandingsTable
            key={groupStandings.groupCode}
            standings={groupStandings}
            locale={locale}
            compact
          />
        ))}
      </div>
    </>
  );
}

function LegendSwatch({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-4 w-4 rounded ring-1 ${className}`} />
      {children}
    </span>
  );
}
