import { ScheduleTimeline, type ScheduleDay } from "@/components/schedule-timeline";
import { Card } from "@/components/ui";
import {
  formatAppDateHeader,
  getAppDateKey,
} from "@/lib/dates";
import { t, getIntlLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAllMatches } from "@/lib/matches";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const locale = await getLocale();
  const intlLocale = getIntlLocale(locale);
  const matches = await getAllMatches();
  const todayKey = getAppDateKey(new Date());
  const days = groupMatchesByDay(matches, intlLocale);
  const scrollTargetKey = getScheduleScrollTargetKey(days, todayKey);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "schedule.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "schedule.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          {t(locale, "schedule.subtitle")}
        </p>
      </div>

      {days.length > 0 ? (
        <ScheduleTimeline
          days={days}
          todayKey={todayKey}
          scrollToKey={scrollTargetKey}
          locale={locale}
          intlLocale={intlLocale}
        />
      ) : (
        <Card>
          <p className="font-semibold text-zinc-950">
            {t(locale, "schedule.empty.title")}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {t(locale, "schedule.empty.body")}
          </p>
        </Card>
      )}
    </>
  );
}

function groupMatchesByDay(matches: Match[], intlLocale: string): ScheduleDay[] {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const dateKey = getAppDateKey(match.kickoff_at);
    const existing = map.get(dateKey) ?? [];
    existing.push(match);
    map.set(dateKey, existing);
  }

  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayMatches]) => ({
      dateKey,
      dateLabel: formatAppDateHeader(dayMatches[0]!.kickoff_at, intlLocale),
      matches: [...dayMatches].sort((left, right) =>
        left.kickoff_at.localeCompare(right.kickoff_at),
      ),
    }));
}

function getScheduleScrollTargetKey(days: ScheduleDay[], todayKey: string) {
  if (days.some((day) => day.dateKey === todayKey)) {
    return todayKey;
  }

  const nextDay = days.find((day) => day.dateKey >= todayKey);
  if (nextDay) {
    return nextDay.dateKey;
  }

  return days[days.length - 1]?.dateKey ?? todayKey;
}
