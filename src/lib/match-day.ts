import { getAppDateKey } from "@/lib/dates";

type MatchWithKickoff = {
  kickoff_at: string;
};

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
