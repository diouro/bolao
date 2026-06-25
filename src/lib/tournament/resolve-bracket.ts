import {
  computeGroupStandings,
  getQualifiedThirdPlaceTeams,
  isGroupStageComplete,
  type GroupStandings,
} from "@/lib/tournament/group-standings";
import { getKnockoutMatchNumber } from "@/lib/tournament/knockout-bracket";
import { normalizeTeamCode } from "@/lib/tournament/team-codes";
import type { Match, Team, TournamentRound } from "@/lib/types";

const knockoutRoundOrder: TournamentRound[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
];

type ResolvedMatch = {
  homeCode: string | null;
  awayCode: string | null;
};

export function enrichMatchesWithBracketTeams(
  matches: Match[],
  teams: Team[],
): Match[] {
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const standings = computeGroupStandings(matches, teams);
  const thirdPlaceBySide = buildThirdPlaceAssignments(matches, standings);
  const resolved = new Map<string, ResolvedMatch>();

  for (const round of knockoutRoundOrder) {
    const roundMatches = matches
      .filter((match) => match.round === round)
      .sort(
        (left, right) =>
          getKnockoutMatchNumber(left) - getKnockoutMatchNumber(right),
      );

    for (const match of roundMatches) {
      const homeCode = resolveSideTeamCode({
        match,
        side: "home",
        standings,
        thirdPlaceBySide,
        resolved,
        matchesById,
      });
      const awayCode = resolveSideTeamCode({
        match,
        side: "away",
        standings,
        thirdPlaceBySide,
        resolved,
        matchesById,
      });

      resolved.set(match.id, { homeCode, awayCode });
    }
  }

  return matches.map((match) => {
    const resolvedMatch = resolved.get(match.id);

    if (!resolvedMatch) {
      return match;
    }

    return {
      ...match,
      home_team_code: resolvedMatch.homeCode ?? match.home_team_code,
      away_team_code: resolvedMatch.awayCode ?? match.away_team_code,
    };
  });
}

function resolveSideTeamCode({
  match,
  side,
  standings,
  thirdPlaceBySide,
  resolved,
  matchesById,
}: {
  match: Match;
  side: "home" | "away";
  standings: GroupStandings[];
  thirdPlaceBySide: Map<string, string>;
  resolved: Map<string, ResolvedMatch>;
  matchesById: Map<string, Match>;
}) {
  const existingCode = normalizeTeamCode(
    side === "home" ? match.home_team_code : match.away_team_code,
  );

  if (existingCode) {
    return existingCode;
  }

  const slot = side === "home" ? match.home_slot : match.away_slot;
  const thirdPlaceCode = thirdPlaceBySide.get(`${match.id}:${side}`);

  if (thirdPlaceCode) {
    return thirdPlaceCode;
  }

  return resolveSlotCode(slot, standings, resolved, matchesById);
}

function resolveSlotCode(
  slot: string | null | undefined,
  standings: GroupStandings[],
  resolved: Map<string, ResolvedMatch>,
  matchesById: Map<string, Match>,
) {
  if (!slot || slot === "TBD") {
    return null;
  }

  const groupWinner = slot.match(/^1([A-L])$/);

  if (groupWinner) {
    return getTeamAtRank(standings, groupWinner[1], 1);
  }

  const groupRunnerUp = slot.match(/^2([A-L])$/);

  if (groupRunnerUp) {
    return getTeamAtRank(standings, groupRunnerUp[1], 2);
  }

  const winner = slot.match(/^W\s+(.+)$/);

  if (winner) {
    const sourceMatchId = slotToMatchId(`W ${winner[1]}`);
    return sourceMatchId
      ? getMatchWinner(sourceMatchId, resolved, matchesById)
      : null;
  }

  const loser = slot.match(/^L\s+(.+)$/);

  if (loser) {
    const sourceMatchId = slotToMatchId(`L ${loser[1]}`);
    return sourceMatchId
      ? getMatchLoser(sourceMatchId, resolved, matchesById)
      : null;
  }

  return null;
}

function getTeamAtRank(
  standings: GroupStandings[],
  groupCode: string,
  rank: number,
) {
  const group = standings.find((entry) => entry.groupCode === groupCode);
  const row = group?.rows.find((entry) => entry.rank === rank);

  return row ? normalizeTeamCode(row.teamCode) : null;
}

function buildThirdPlaceAssignments(
  matches: Match[],
  standings: GroupStandings[],
) {
  const assignments = new Map<string, string>();

  if (!isGroupStageComplete(matches)) {
    return assignments;
  }

  const qualifiedThirds = getQualifiedThirdPlaceTeams(standings);
  const assigned = new Set<string>();

  const roundOf32Matches = matches
    .filter((match) => match.round === "round_of_32")
    .sort(
      (left, right) =>
        getKnockoutMatchNumber(left) - getKnockoutMatchNumber(right),
    );

  for (const match of roundOf32Matches) {
    for (const side of ["home", "away"] as const) {
      const slot = side === "home" ? match.home_slot : match.away_slot;
      const thirdPlaceSlot = slot?.match(/^3([A-L]+)$/);

      if (!thirdPlaceSlot) {
        continue;
      }

      const eligibleGroups = thirdPlaceSlot[1].split("");
      const candidate = qualifiedThirds.find(
        (entry) =>
          !assigned.has(entry.teamCode) &&
          eligibleGroups.includes(entry.groupCode),
      );

      if (!candidate) {
        continue;
      }

      assignments.set(`${match.id}:${side}`, candidate.teamCode);
      assigned.add(candidate.teamCode);
    }
  }

  return assignments;
}

function slotToMatchId(slotLabel: string) {
  const patterns: Array<[RegExp, string]> = [
    [/^W R32-(\d+)$/, "wc2026-r32-"],
    [/^W R16-(\d+)$/, "wc2026-r16-"],
    [/^W QF-(\d+)$/, "wc2026-qf-"],
    [/^W SF-(\d+)$/, "wc2026-sf-"],
    [/^L SF-(\d+)$/, "wc2026-sf-"],
  ];

  for (const [pattern, prefix] of patterns) {
    const match = slotLabel.match(pattern);

    if (match) {
      return `${prefix}${match[1]}`;
    }
  }

  return null;
}

function getMatchWinner(
  matchId: string,
  resolved: Map<string, ResolvedMatch>,
  matchesById: Map<string, Match>,
) {
  const sourceMatch = matchesById.get(matchId);
  const sourceResolved = resolved.get(matchId);

  if (
    !sourceMatch ||
    !sourceResolved?.homeCode ||
    !sourceResolved.awayCode ||
    sourceMatch.home_score == null ||
    sourceMatch.away_score == null
  ) {
    return null;
  }

  if (sourceMatch.home_score > sourceMatch.away_score) {
    return sourceResolved.homeCode;
  }

  if (sourceMatch.away_score > sourceMatch.home_score) {
    return sourceResolved.awayCode;
  }

  return null;
}

function getMatchLoser(
  matchId: string,
  resolved: Map<string, ResolvedMatch>,
  matchesById: Map<string, Match>,
) {
  const winner = getMatchWinner(matchId, resolved, matchesById);
  const sourceResolved = resolved.get(matchId);

  if (!winner || !sourceResolved?.homeCode || !sourceResolved?.awayCode) {
    return null;
  }

  return winner === sourceResolved.homeCode
    ? sourceResolved.awayCode
    : sourceResolved.homeCode;
}
