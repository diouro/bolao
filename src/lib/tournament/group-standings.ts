import { groupOrder, type GroupCategory } from "@/lib/tournament/fixture-categories";
import type { Match, Team } from "@/lib/types";

export type GroupStandingRow = {
  rank: number;
  teamCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupStandings = {
  groupCode: GroupCategory;
  rows: GroupStandingRow[];
};

type MutableStanding = Omit<GroupStandingRow, "rank" | "goalDifference">;

function createStanding(teamCode: string): MutableStanding {
  return {
    teamCode,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function applyMatchResult(
  standing: MutableStanding,
  goalsFor: number,
  goalsAgainst: number,
) {
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;

  if (goalsFor > goalsAgainst) {
    standing.won += 1;
    standing.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    standing.drawn += 1;
    standing.points += 1;
    return;
  }

  standing.lost += 1;
}

function compareStandings(left: MutableStanding, right: MutableStanding) {
  const leftGoalDifference = left.goalsFor - left.goalsAgainst;
  const rightGoalDifference = right.goalsFor - right.goalsAgainst;

  if (left.points !== right.points) {
    return right.points - left.points;
  }

  if (leftGoalDifference !== rightGoalDifference) {
    return rightGoalDifference - leftGoalDifference;
  }

  if (left.goalsFor !== right.goalsFor) {
    return right.goalsFor - left.goalsFor;
  }

  return left.teamCode.localeCompare(right.teamCode);
}

function finalizeStanding(standing: MutableStanding, rank: number): GroupStandingRow {
  return {
    ...standing,
    rank,
    goalDifference: standing.goalsFor - standing.goalsAgainst,
  };
}

export function computeGroupStandings(
  matches: Match[],
  teams: Team[],
): GroupStandings[] {
  const standingsByGroup = new Map<GroupCategory, Map<string, MutableStanding>>();

  for (const groupCode of groupOrder) {
    const groupTeams = teams.filter((team) => team.group === groupCode);
    const groupStandings = new Map<string, MutableStanding>();

    for (const team of groupTeams) {
      groupStandings.set(team.code, createStanding(team.code));
    }

    standingsByGroup.set(groupCode, groupStandings);
  }

  for (const match of matches) {
    if (match.round !== "group" || match.status !== "finished") {
      continue;
    }

    if (
      match.home_score == null ||
      match.away_score == null ||
      !match.home_team_code ||
      !match.away_team_code ||
      !match.group_code
    ) {
      continue;
    }

    const groupCode = match.group_code as GroupCategory;
    const groupStandings = standingsByGroup.get(groupCode);

    if (!groupStandings) {
      continue;
    }

    const homeStanding = groupStandings.get(match.home_team_code);
    const awayStanding = groupStandings.get(match.away_team_code);

    if (!homeStanding || !awayStanding) {
      continue;
    }

    applyMatchResult(homeStanding, match.home_score, match.away_score);
    applyMatchResult(awayStanding, match.away_score, match.home_score);
  }

  return groupOrder.map((groupCode) => {
    const groupStandings = standingsByGroup.get(groupCode)!;
    const rows = [...groupStandings.values()]
      .sort(compareStandings)
      .map((standing, index) => finalizeStanding(standing, index + 1));

    return { groupCode, rows };
  });
}
