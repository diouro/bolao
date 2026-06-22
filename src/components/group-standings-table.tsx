import { CountryFlag } from "@/components/country-flag";
import { t, type Locale } from "@/lib/i18n";
import type { GroupStandings } from "@/lib/tournament/group-standings";
import { getTeamName } from "@/lib/tournament/load-fixtures";
import { cn } from "@/lib/utils";

export function GroupStandingsTable({
  standings,
  locale,
  compact = false,
}: {
  standings: GroupStandings;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-950">
          {t(locale, "common.group")} {standings.groupCode}
        </h2>
      </div>

      <div
        className={cn(
          "grid border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 sm:px-4",
          compact
            ? "grid-cols-[28px_minmax(0,1fr)_28px_36px_36px]"
            : "grid-cols-[28px_minmax(0,1fr)_28px_28px_28px_28px_36px_36px] sm:grid-cols-[32px_minmax(0,1fr)_36px_36px_36px_36px_44px_44px_44px]",
        )}
      >
        <div>#</div>
        <div>{t(locale, "groups.team")}</div>
        <div className="text-center">{t(locale, "groups.played")}</div>
        {!compact && (
          <>
            <div className="hidden text-center sm:block">
              {t(locale, "groups.won")}
            </div>
            <div className="hidden text-center sm:block">
              {t(locale, "groups.drawn")}
            </div>
            <div className="hidden text-center sm:block">
              {t(locale, "groups.lost")}
            </div>
          </>
        )}
        <div className="text-center">{t(locale, "groups.goalDiff")}</div>
        <div className="text-center">{t(locale, "groups.points")}</div>
      </div>

      {standings.rows.map((row) => (
        <div
          key={row.teamCode}
          className={cn(
            "grid items-center border-b border-zinc-100 px-3 py-3 last:border-b-0 sm:px-4",
            compact
              ? "grid-cols-[28px_minmax(0,1fr)_28px_36px_36px]"
              : "grid-cols-[28px_minmax(0,1fr)_28px_28px_28px_28px_36px_36px] sm:grid-cols-[32px_minmax(0,1fr)_36px_36px_36px_36px_44px_44px_44px]",
            row.rank <= 2 && "bg-emerald-50/70",
            row.rank === 3 && "bg-amber-50/60",
          )}
        >
          <div className="text-sm font-black text-zinc-700">{row.rank}</div>
          <div className="flex min-w-0 items-center gap-2">
            <CountryFlag
              code={row.teamCode}
              className="h-5 w-7 shrink-0 rounded object-cover shadow-sm"
            />
            <span className="truncate text-sm font-semibold text-zinc-950">
              {getTeamName(row.teamCode, locale)}
            </span>
          </div>
          <div className="text-center text-sm font-semibold text-zinc-800">
            {row.played}
          </div>
          {!compact && (
            <>
              <div className="hidden text-center text-sm font-semibold text-zinc-800 sm:block">
                {row.won}
              </div>
              <div className="hidden text-center text-sm font-semibold text-zinc-800 sm:block">
                {row.drawn}
              </div>
              <div className="hidden text-center text-sm font-semibold text-zinc-800 sm:block">
                {row.lost}
              </div>
            </>
          )}
          <div
            className={cn(
              "text-center text-sm font-semibold",
              row.goalDifference > 0 && "text-emerald-700",
              row.goalDifference < 0 && "text-red-600",
              row.goalDifference === 0 && "text-zinc-800",
            )}
          >
            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
          </div>
          <div className="text-center text-sm font-black text-zinc-950">
            {row.points}
          </div>
        </div>
      ))}
    </div>
  );
}
