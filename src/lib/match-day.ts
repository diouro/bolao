import { getAppDateKey } from "@/lib/dates";
import type { MatchStatus } from "@/lib/types";

type MatchWithKickoff = {
  kickoff_at: string;
};

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

export function getNextMatchDayKey(
  matches: MatchWithKickoff[],
  now = new Date(),
) {
  const todayKey = getAppDateKey(now);
  const sorted = [...matches].sort((a, b) =>
    a.kickoff_at.localeCompare(b.kickoff_at),
  );
  const anchor = sorted.find(
    (match) => getAppDateKey(match.kickoff_at) >= todayKey,
  );

  return anchor ? getAppDateKey(anchor.kickoff_at) : null;
}

export function getMatchesForNextMatchDay<T extends MatchWithKickoff>(
  matches: T[],
  now = new Date(),
): T[] {
  const matchDay = getNextMatchDayKey(matches, now);

  if (!matchDay) {
    return [];
  }

  return matches
    .filter((match) => getAppDateKey(match.kickoff_at) === matchDay)
    .sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
}
