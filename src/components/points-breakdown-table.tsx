import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { t, type Locale } from "@/lib/i18n";
import type { PointsBreakdown } from "@/lib/points-breakdown";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";

export function PointsBreakdownTable({
  breakdown,
  locale,
}: {
  breakdown: PointsBreakdown;
  locale: Locale;
}) {
  if (breakdown.matches.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-zinc-950">
          {t(locale, "breakdown.empty.title")}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          {t(locale, "breakdown.empty.body")}
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="max-h-[75vh] overflow-auto">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <StickyHeader className="left-0 z-30 min-w-56">
                {t(locale, "breakdown.player")}
              </StickyHeader>
              <StickyHeader className="left-56 z-30 min-w-24 text-right">
                {t(locale, "breakdown.total")}
              </StickyHeader>
              {breakdown.matches.map((match) => (
                <th
                  key={match.id}
                  className="sticky top-0 z-20 min-w-36 border-b border-zinc-200 bg-zinc-50 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500"
                >
                  <div className="truncate">{getMatchLabel(match)}</div>
                  <div className="mt-1 text-[11px] font-semibold normal-case text-zinc-400">
                    {match.home_score}-{match.away_score}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {breakdown.users.map((user) => (
              <tr key={user.profile.id} className="group">
                <td className="sticky left-0 z-10 border-b border-zinc-100 bg-white px-4 py-3 group-hover:bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-zinc-950">
                        {user.profile.display_name ?? user.profile.email}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {user.profile.email}
                      </div>
                    </div>
                    {user.profile.has_paid && (
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                        title={t(locale, "common.paid")}
                        aria-label={t(locale, "common.paid")}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="sticky left-56 z-10 border-b border-zinc-100 bg-white px-4 py-3 text-right text-lg font-black text-emerald-700 group-hover:bg-zinc-50">
                  {user.totalPoints}
                </td>
                {user.cells.map((cell) => (
                  <td
                    key={`${user.profile.id}-${cell.match.id}`}
                    className="border-b border-zinc-100 px-3 py-3 group-hover:bg-zinc-50"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2">
                      <div>
                        <div className="font-black text-zinc-950">
                          {cell.prediction
                            ? `${cell.prediction.home_score}-${cell.prediction.away_score}`
                            : "-"}
                        </div>
                        <div className="text-xs font-semibold text-zinc-400">
                          {cell.score.exact
                            ? t(locale, "breakdown.exact")
                            : cell.score.result
                              ? t(locale, "breakdown.outcome")
                              : cell.prediction
                                ? t(locale, "breakdown.wrong")
                                : t(locale, "breakdown.noPick")}
                        </div>
                      </div>
                      <div className="rounded-full bg-zinc-950 px-2.5 py-1 text-xs font-black text-white">
                        {cell.score.points}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StickyHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`sticky top-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function getMatchLabel(match: PointsBreakdown["matches"][number]) {
  const home = resolveMatchSide(match, "home");
  const away = resolveMatchSide(match, "away");
  return `${home.code ?? home.name} v ${away.code ?? away.name}`;
}
