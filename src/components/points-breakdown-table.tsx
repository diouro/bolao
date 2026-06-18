"use client";

import { Check } from "lucide-react";
import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { Card } from "@/components/ui";
import { formatAppDateShort, getAppDateKey } from "@/lib/dates";
import { t, type Locale } from "@/lib/i18n";
import type { PointsBreakdown } from "@/lib/points-breakdown";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import { cn } from "@/lib/utils";

type BreakdownOutcome = "exact" | "outcome" | "wrong" | "noPick";

const outcomeStyles: Record<
  BreakdownOutcome,
  { cell: string; label: string; badge: string }
> = {
  exact: {
    cell: "bg-emerald-50",
    label: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
  },
  outcome: {
    cell: "bg-amber-50",
    label: "text-amber-700",
    badge: "bg-amber-500 text-zinc-950",
  },
  wrong: {
    cell: "bg-rose-50",
    label: "text-rose-700",
    badge: "bg-rose-600 text-white",
  },
  noPick: {
    cell: "bg-zinc-50",
    label: "text-zinc-400",
    badge: "bg-zinc-400 text-white",
  },
};

function getBreakdownOutcome(cell: {
  prediction: PointsBreakdown["users"][number]["cells"][number]["prediction"];
  score: PointsBreakdown["users"][number]["cells"][number]["score"];
}): BreakdownOutcome {
  if (cell.score.exact) {
    return "exact";
  }

  if (cell.score.result) {
    return "outcome";
  }

  if (cell.prediction) {
    return "wrong";
  }

  return "noPick";
}

function getBreakdownOutcomeLabel(
  locale: Locale,
  outcome: BreakdownOutcome,
) {
  const labelKeys: Record<BreakdownOutcome, "breakdown.exact" | "breakdown.outcome" | "breakdown.wrong" | "breakdown.noPick"> =
    {
      exact: "breakdown.exact",
      outcome: "breakdown.outcome",
      wrong: "breakdown.wrong",
      noPick: "breakdown.noPick",
    };

  return t(locale, labelKeys[outcome]);
}

export function PointsBreakdownTable({
  breakdown,
  locale,
  intlLocale,
  todayKey,
  scrollToMatchId,
}: {
  breakdown: PointsBreakdown;
  locale: Locale;
  intlLocale: string;
  todayKey: string;
  scrollToMatchId: string | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!scrollToMatchId) {
      return;
    }

    const columnIndex = breakdown.matches.findIndex(
      (match) => match.id === scrollToMatchId,
    );

    const alignTodayColumn = () => {
      const container = scrollerRef.current;
      const stickyBoundary = container?.querySelector<HTMLElement>(
        "[data-breakdown-sticky-boundary]",
      );
      const firstRow = container?.querySelector("tbody tr");
      const target =
        columnIndex >= 0
          ? (firstRow?.children.item(2 + columnIndex) as HTMLElement | null)
          : document.getElementById(`breakdown-match-${scrollToMatchId}`);

      if (!container || !target || !stickyBoundary) {
        return false;
      }

      const stickyEnd =
        stickyBoundary.offsetLeft + stickyBoundary.offsetWidth;
      const targetStart = target.offsetLeft;

      if (targetStart > stickyEnd) {
        container.scrollLeft = targetStart - stickyEnd;
        return true;
      }

      const delta =
        target.getBoundingClientRect().left -
        stickyBoundary.getBoundingClientRect().right;

      if (Math.abs(delta) > 1) {
        container.scrollLeft = Math.max(0, container.scrollLeft + delta);
      }

      return true;
    };

    if (!alignTodayColumn()) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      alignTodayColumn();
      requestAnimationFrame(alignTodayColumn);
    });
    const timeout = window.setTimeout(alignTodayColumn, 150);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [breakdown.matches, scrollToMatchId]);

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
      <div ref={scrollerRef} className="max-h-[75vh] overflow-auto">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <StickyHeader className="left-0 z-30 w-40 min-w-40 sm:w-56 sm:min-w-56">
                {t(locale, "breakdown.player")}
              </StickyHeader>
              <StickyHeader
                className="left-40 z-30 w-16 min-w-16 px-2 text-right sm:left-56 sm:w-24 sm:min-w-24 sm:px-4"
                data-breakdown-sticky-boundary
              >
                {t(locale, "breakdown.total")}
              </StickyHeader>
              {breakdown.matches.map((match) => {
                const isToday = getAppDateKey(match.kickoff_at) === todayKey;

                return (
                <th
                  key={match.id}
                  id={`breakdown-match-${match.id}`}
                  className={cn(
                    "sticky top-0 z-20 min-w-28 border-b px-3 py-3 text-left text-xs font-bold uppercase tracking-wide sm:min-w-36",
                    isToday
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500",
                  )}
                >
                  <div className="truncate">{getMatchLabel(match, locale)}</div>
                  <div
                    className={cn(
                      "mt-1 text-[11px] font-semibold normal-case",
                      isToday ? "text-emerald-700" : "text-zinc-500",
                    )}
                  >
                    {formatAppDateShort(match.kickoff_at, intlLocale)}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-[11px] font-semibold normal-case",
                      isToday ? "text-emerald-600" : "text-zinc-400",
                    )}
                  >
                    {match.home_score}-{match.away_score}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {breakdown.users.map((user) => (
              <tr key={user.profile.id} className="group">
                <td className="sticky left-0 z-10 w-40 max-w-40 border-b border-zinc-100 bg-white px-3 py-3 group-hover:bg-zinc-50 sm:w-56 sm:max-w-56 sm:px-4">
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
                <td className="sticky left-40 z-10 w-16 border-b border-zinc-100 bg-white px-2 py-3 text-right text-lg font-black text-emerald-700 group-hover:bg-zinc-50 sm:left-56 sm:w-24 sm:px-4">
                  {user.totalPoints}
                </td>
                {user.cells.map((cell) => {
                  const outcome = getBreakdownOutcome(cell);
                  const styles = outcomeStyles[outcome];

                  return (
                  <td
                    key={`${user.profile.id}-${cell.match.id}`}
                    className="border-b border-zinc-100 px-3 py-3 group-hover:bg-zinc-50"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl px-3 py-2",
                        styles.cell,
                      )}
                    >
                      <div>
                        <div className="font-black text-zinc-950">
                          {cell.prediction
                            ? `${cell.prediction.home_score}-${cell.prediction.away_score}`
                            : "-"}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-semibold",
                            styles.label,
                          )}
                        >
                          {getBreakdownOutcomeLabel(locale, outcome)}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-black",
                          styles.badge,
                        )}
                      >
                        {cell.score.points}
                      </div>
                    </div>
                  </td>
                  );
                })}
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
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`sticky top-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-500 ${className ?? ""}`}
      {...props}
    >
      {children}
    </th>
  );
}

function getMatchLabel(
  match: PointsBreakdown["matches"][number],
  locale: Locale,
) {
  const home = resolveMatchSide(match, "home", locale);
  const away = resolveMatchSide(match, "away", locale);
  return `${home.name} v ${away.name}`;
}
