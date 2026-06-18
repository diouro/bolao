import { t, type Locale } from "@/lib/i18n";
import { getLocalizedTeamName } from "@/lib/tournament/team-names";
import type { Match } from "@/lib/types";

export type ResolvedSide = {
  code: string | null;
  name: string;
  slot: string | null;
  isPlaceholder: boolean;
};

export function resolveMatchSide(
  match: Match,
  side: "home" | "away",
  locale: Locale,
): ResolvedSide {
  const code = side === "home" ? match.home_team_code : match.away_team_code;
  const apiName = side === "home" ? match.home_team_name : match.away_team_name;
  const slot = side === "home" ? match.home_slot : match.away_slot;
  const teamCode = code;

  if (teamCode || apiName) {
    return {
      code: teamCode,
      name: getLocalizedTeamName(locale, teamCode, apiName),
      slot: null,
      isPlaceholder: false,
    };
  }

  return {
    code: null,
    name: formatSlotName(slot, locale),
    slot,
    isPlaceholder: true,
  };
}

function formatSlotName(slot: string | null | undefined, locale: Locale) {
  if (!slot || slot === "TBD") {
    return t(locale, "teams.tbd");
  }

  const groupWinner = slot.match(/^1([A-L])$/);

  if (groupWinner) {
    return t(locale, "slots.winnerGroup", { group: groupWinner[1] });
  }

  const groupRunnerUp = slot.match(/^2([A-L])$/);

  if (groupRunnerUp) {
    return t(locale, "slots.runnerUpGroup", { group: groupRunnerUp[1] });
  }

  const thirdPlace = slot.match(/^3([A-L]+)$/);

  if (thirdPlace) {
    return t(locale, "slots.bestThird", {
      groups: thirdPlace[1].split("").join("/"),
    });
  }

  const winner = slot.match(/^W\s+(.+)$/);

  if (winner) {
    return t(locale, "slots.winner", { label: winner[1] });
  }

  const loser = slot.match(/^L\s+(.+)$/);

  if (loser) {
    return t(locale, "slots.loser", { label: loser[1] });
  }

  return slot;
}

export function formatMatchTeamsLabel(match: Match, locale: Locale) {
  const home = resolveMatchSide(match, "home", locale);
  const away = resolveMatchSide(match, "away", locale);

  return `${home.name} v ${away.name}`;
}
