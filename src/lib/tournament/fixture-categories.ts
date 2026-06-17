import type { TournamentRound } from "@/lib/types";
import { getMatchesForNextMatchDay } from "@/lib/match-day";
import type { MatchWithPrediction } from "@/lib/types";

export const knockoutRoundOrder = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const satisfies readonly TournamentRound[];

export const groupOrder = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupCategory = (typeof groupOrder)[number];
export type KnockoutCategory = (typeof knockoutRoundOrder)[number];
export type FixtureCategory = GroupCategory | KnockoutCategory;

export function getDefaultFixtureCategory(
  matches: MatchWithPrediction[],
): FixtureCategory {
  const activeMatches = matches.filter((match) => match.status !== "finished");
  const sameDayMatches = getMatchesForNextMatchDay(activeMatches);

  if (sameDayMatches.length === 0) {
    return "A";
  }

  const groupMatch = sameDayMatches.find(
    (match) => match.round === "group" && match.group_code,
  );

  if (
    groupMatch?.group_code &&
    groupOrder.includes(groupMatch.group_code as GroupCategory)
  ) {
    return groupMatch.group_code as GroupCategory;
  }

  const knockoutMatch = sameDayMatches.find((match) => match.round !== "group");

  if (knockoutMatch && isKnockoutRound(knockoutMatch.round)) {
    return knockoutMatch.round;
  }

  return "A";
}

export function normalizeCategory(group?: string): FixtureCategory {
  if (group === "knockout") {
    return "round_of_32";
  }

  const normalizedRound = group?.toLowerCase() as KnockoutCategory | undefined;

  if (normalizedRound && knockoutRoundOrder.includes(normalizedRound)) {
    return normalizedRound;
  }

  const normalized = group?.toUpperCase() ?? "A";

  return groupOrder.includes(normalized as GroupCategory)
    ? (normalized as GroupCategory)
    : "A";
}

export function isKnockoutRound(round: TournamentRound): round is KnockoutCategory {
  return knockoutRoundOrder.includes(round as KnockoutCategory);
}

export function isKnockoutCategory(
  category: FixtureCategory,
): category is KnockoutCategory {
  return knockoutRoundOrder.includes(category as KnockoutCategory);
}

export function getSelectedCategoryFromSearchParam(
  groupParam?: string,
): FixtureCategory | null {
  if (!groupParam) {
    return null;
  }

  return normalizeCategory(groupParam);
}
