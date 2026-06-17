import type { Match, TournamentRound } from "@/lib/types";

export const bracketDisplayRounds = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
] as const satisfies readonly TournamentRound[];

export type BracketDisplayRound = (typeof bracketDisplayRounds)[number];

const bracketHalfSizes: Record<BracketDisplayRound, number> = {
  round_of_32: 8,
  round_of_16: 4,
  quarter_final: 2,
  semi_final: 1,
  final: 1,
};

export function getKnockoutMatchNumber(match: Match) {
  const suffix = match.id.match(/-(\d+)$/);
  return suffix ? Number(suffix[1]) : 1;
}

export function getKnockoutMatchesByRound(matches: Match[]) {
  const grouped = new Map<TournamentRound, Match[]>();

  for (const match of matches) {
    if (match.round === "group" || match.round === "third_place") {
      continue;
    }

    const existing = grouped.get(match.round) ?? [];
    existing.push(match);
    grouped.set(match.round, existing);
  }

  grouped.forEach((roundMatches, round) => {
    grouped.set(
      round,
      [...roundMatches].sort(
        (a, b) => getKnockoutMatchNumber(a) - getKnockoutMatchNumber(b),
      ),
    );
  });

  return grouped;
}

export function getThirdPlaceMatch(matches: Match[]) {
  return matches.find((match) => match.round === "third_place") ?? null;
}

export function getFinalMatch(matches: Match[]) {
  return matches.find((match) => match.round === "final") ?? null;
}

export function getBracketHalfMatches(
  round: BracketDisplayRound,
  half: "left" | "right",
  matches: Match[],
) {
  const roundMatches =
    getKnockoutMatchesByRound(matches).get(round)?.slice() ?? [];
  const halfSize = bracketHalfSizes[round];

  if (round === "final") {
    return roundMatches;
  }

  if (half === "left") {
    return roundMatches.slice(0, halfSize);
  }

  return roundMatches.slice(halfSize);
}

export function getBracketRowSpan(round: BracketDisplayRound) {
  return 16 / bracketHalfSizes[round];
}

export function getBracketRowStart(index: number, round: BracketDisplayRound) {
  return index * getBracketRowSpan(round) + 1;
}

export function hasMatchResult(match: Match) {
  return match.home_score !== null && match.away_score !== null;
}
