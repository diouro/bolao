import fixtureData from "../../../data/world-cup-2026.json";
import type { Team, TournamentFixture } from "@/lib/types";

const fixture = fixtureData as TournamentFixture;
const teamMap = new Map(fixture.teams.map((team) => [team.code, team]));

export function getTournamentFixture() {
  return fixture;
}

export function getTeams() {
  return fixture.teams;
}

export function getTeam(code?: string | null): Team | null {
  if (!code) {
    return null;
  }

  return teamMap.get(code) ?? null;
}

export function getTeamName(code?: string | null) {
  return getTeam(code)?.name ?? code ?? "";
}
