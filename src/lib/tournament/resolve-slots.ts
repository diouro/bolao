import { getTeam } from "@/lib/tournament/load-fixtures";
import type { Match } from "@/lib/types";

export type ResolvedSide = {
  code: string | null;
  name: string;
  slot: string | null;
  isPlaceholder: boolean;
};

export function resolveMatchSide(match: Match, side: "home" | "away"): ResolvedSide {
  const code = side === "home" ? match.home_team_code : match.away_team_code;
  const slot = side === "home" ? match.home_slot : match.away_slot;
  const team = getTeam(code);

  if (team) {
    return {
      code: team.code,
      name: team.name,
      slot: null,
      isPlaceholder: false,
    };
  }

  return {
    code: null,
    name: slot ?? "TBD",
    slot,
    isPlaceholder: true,
  };
}
