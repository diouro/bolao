"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CountryFlag } from "@/components/country-flag";
import { Badge, Card } from "@/components/ui";
import { formatAppTime } from "@/lib/dates";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { hasMatchResult } from "@/lib/tournament/knockout-bracket";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ScheduleDay = {
  dateKey: string;
  dateLabel: string;
  matches: Match[];
};

const roundLabelKeys: Record<string, TranslationKey> = {
  group: "round.group",
  round_of_32: "round.round_of_32",
  round_of_16: "round.round_of_16",
  quarter_final: "round.quarter_final",
  semi_final: "round.semi_final",
  third_place: "round.third_place",
  final: "round.final",
};

export function ScheduleTimeline({
  days,
  todayKey,
  scrollToKey,
  locale,
  intlLocale,
}: {
  days: ScheduleDay[];
  todayKey: string;
  scrollToKey: string;
  locale: Locale;
  intlLocale: string;
}) {
  useEffect(() => {
    const target = document.getElementById(`schedule-day-${scrollToKey}`);

    if (target) {
      target.scrollIntoView({ block: "start" });
    }
  }, [scrollToKey]);

  return (
    <div className="relative space-y-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-zinc-200 sm:before:left-6">
      {days.map((day) => {
        const isToday = day.dateKey === todayKey;

        return (
          <section
            key={day.dateKey}
            id={`schedule-day-${day.dateKey}`}
            className="relative scroll-mt-28 pl-10 sm:pl-14"
          >
            <div
              className={cn(
                "absolute left-2.5 top-2 h-3 w-3 rounded-full ring-4 ring-zinc-100 sm:left-[1.125rem]",
                isToday ? "bg-emerald-600 ring-emerald-100" : "bg-zinc-300",
              )}
            />
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2
                className={cn(
                  "text-lg font-black text-zinc-950 sm:text-xl",
                  isToday && "text-emerald-800",
                )}
              >
                {day.dateLabel}
              </h2>
              {isToday && (
                <Badge className="bg-emerald-600 text-white">
                  {t(locale, "schedule.today")}
                </Badge>
              )}
              <span className="text-sm font-semibold text-zinc-500">
                {t(locale, "schedule.matches", { count: day.matches.length })}
              </span>
            </div>

            <div className="grid gap-3">
              {day.matches.map((match) => (
                <ScheduleMatchRow
                  key={match.id}
                  match={match}
                  locale={locale}
                  intlLocale={intlLocale}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ScheduleMatchRow({
  match,
  locale,
  intlLocale,
}: {
  match: Match;
  locale: Locale;
  intlLocale: string;
}) {
  const home = resolveMatchSide(match, "home");
  const away = resolveMatchSide(match, "away");
  const hasResult = hasMatchResult(match);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished" || hasResult;
  const predictionsHref =
    match.round === "group" && match.group_code
      ? `/predictions?group=${match.group_code}#match-${match.id}`
      : `/predictions?group=${match.round}#match-${match.id}`;

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition",
        isFinished && "border-zinc-200 bg-zinc-50/70",
        isLive && !isFinished && "border-emerald-300 bg-emerald-50/40",
      )}
    >
      <Link href={predictionsHref} className="block p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white shadow-sm">
              {t(locale, roundLabelKeys[match.round] ?? "common.match")}
            </Badge>
            {match.group_code && (
              <Badge className="bg-emerald-50 text-emerald-700">
                {t(locale, "common.group")} {match.group_code}
              </Badge>
            )}
            {isLive && !isFinished && (
              <Badge className="bg-emerald-600 text-white">
                {t(locale, "match.live")}
              </Badge>
            )}
            {isFinished && (
              <Badge className="bg-zinc-200 text-zinc-700">
                {t(locale, "schedule.finished")}
              </Badge>
            )}
          </div>
          <time className="text-sm font-semibold text-zinc-500">
            {formatAppTime(match.kickoff_at, intlLocale)}
          </time>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <ScheduleTeam side={home} align="left" />
          <div className="flex justify-center">
            <div className="rounded-2xl bg-zinc-950 px-4 py-2 text-center text-white">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                {hasResult
                  ? t(locale, "match.fullTime")
                  : isLive
                    ? t(locale, "match.live")
                    : t(locale, "common.match")}
              </div>
              <div className="text-xl font-black tabular-nums">
                {hasResult
                  ? `${match.home_score}-${match.away_score}`
                  : isLive
                    ? t(locale, "common.tbd")
                    : "vs"}
              </div>
            </div>
          </div>
          <ScheduleTeam side={away} align="right" />
        </div>
      </Link>
    </Card>
  );
}

function ScheduleTeam({
  side,
  align,
}: {
  side: ReturnType<typeof resolveMatchSide>;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <CountryFlag
        code={side.code}
        slot={side.slot}
        className="h-8 w-11 rounded-lg object-cover shadow-sm ring-1 ring-zinc-200"
      />
      <div className="min-w-0">
        <div className="truncate font-bold text-zinc-950">{side.name}</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {side.code ?? side.slot ?? "TBD"}
        </div>
      </div>
    </div>
  );
}
