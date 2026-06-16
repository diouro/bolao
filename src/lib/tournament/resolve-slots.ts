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
  const apiName = side === "home" ? match.home_team_name : match.away_team_name;
  const slot = side === "home" ? match.home_slot : match.away_slot;
  const team = getTeam(code);

  if (team || apiName || code) {
    return {
      code: team?.code ?? code,
      name: team?.name ?? apiName ?? code ?? "TBD",
      slot: null,
      isPlaceholder: false,
    };
  }

  return {
    code: null,
    name: formatSlotName(slot),
    slot,
    isPlaceholder: true,
  };
}

function formatSlotName(slot?: string | null) {
  if (!slot || slot === "TBD") {
    return "Team TBD";
  }

  const groupWinner = slot.match(/^1([A-L])$/);

  if (groupWinner) {
    return `Winner Group ${groupWinner[1]}`;
  }

  const groupRunnerUp = slot.match(/^2([A-L])$/);

  if (groupRunnerUp) {
    return `Runner-up Group ${groupRunnerUp[1]}`;
  }

  const thirdPlace = slot.match(/^3([A-L]+)$/);

  if (thirdPlace) {
    return `Best 3rd ${thirdPlace[1].split("").join("/")}`;
  }

  const winner = slot.match(/^W\s+(.+)$/);

  if (winner) {
    return `Winner ${winner[1]}`;
  }

  const loser = slot.match(/^L\s+(.+)$/);

  if (loser) {
    return `Loser ${loser[1]}`;
  }

  return slot;
}
