import { getAppDateKey } from "@/lib/dates";
import type { MatchStatus } from "@/lib/types";

export type DashboardMatchPhase = "live" | "upcoming" | "finished";

const dashboardPhaseRank: Record<DashboardMatchPhase, number> = {
  live: 0,
  upcoming: 1,
  finished: 2,
};

export function getDashboardMatchPhase(
  match: { kickoff_at: string; status: MatchStatus },
  now = new Date(),
): DashboardMatchPhase {
  if (match.status === "finished") {
    return "finished";
  }

  if (match.status === "live") {
    return "live";
  }

  if (new Date(match.kickoff_at).getTime() <= now.getTime()) {
    return "live";
  }

  return "upcoming";
}

export function sortDashboardMatches<
  T extends { kickoff_at: string; status: MatchStatus },
>(matches: T[], now = new Date()): T[] {
  return [...matches].sort((a, b) => {
    const phaseDiff =
      dashboardPhaseRank[getDashboardMatchPhase(a, now)] -
      dashboardPhaseRank[getDashboardMatchPhase(b, now)];

    if (phaseDiff !== 0) {
      return phaseDiff;
    }

    return a.kickoff_at.localeCompare(b.kickoff_at);
  });
}

type MatchForMatchDay = {
  kickoff_at: string;
  status?: MatchStatus;
};

export function getNextMatchDayKey(
  matches: MatchForMatchDay[],
  now = new Date(),
) {
  const todayKey = getAppDateKey(now);
  const dateKeys = [
    ...new Set(matches.map((match) => getAppDateKey(match.kickoff_at))),
  ].sort();

  if (dateKeys.length === 0) {
    return null;
  }

  const candidateKeys = dateKeys.filter((dateKey) => dateKey >= todayKey);
  const keysToCheck =
    candidateKeys.length > 0 ? candidateKeys : [dateKeys[dateKeys.length - 1]!];

  for (const dateKey of keysToCheck) {
    const dayMatches = matches.filter(
      (match) => getAppDateKey(match.kickoff_at) === dateKey,
    );

    if (!isMatchDayComplete(dayMatches)) {
      return dateKey;
    }
  }

  return keysToCheck[keysToCheck.length - 1] ?? null;
}

function isMatchDayComplete(dayMatches: MatchForMatchDay[]) {
  if (dayMatches.length === 0) {
    return true;
  }

  return dayMatches.every((match) => match.status === "finished");
}

export function getMatchesForNextMatchDay<
  T extends MatchForMatchDay,
>(matches: T[], now = new Date()): T[] {
  const matchDay = getNextMatchDayKey(matches, now);

  if (!matchDay) {
    return [];
  }

  return matches
    .filter((match) => getAppDateKey(match.kickoff_at) === matchDay)
    .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
}
