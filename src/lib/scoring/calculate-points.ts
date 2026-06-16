import type { ScoreBreakdown } from "@/lib/types";

function resultOf(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) {
    return "home";
  }

  if (awayScore > homeScore) {
    return "away";
  }

  return "draw";
}

export function calculatePoints({
  predictionHome,
  predictionAway,
  actualHome,
  actualAway,
}: {
  predictionHome: number;
  predictionAway: number;
  actualHome: number | null;
  actualAway: number | null;
}): ScoreBreakdown {
  if (actualHome === null || actualAway === null) {
    return {
      points: 0,
      exact: false,
      result: false,
    };
  }

  const exact = predictionHome === actualHome && predictionAway === actualAway;
  const result =
    resultOf(predictionHome, predictionAway) === resultOf(actualHome, actualAway);

  return {
    points: exact ? 3 : result ? 1 : 0,
    exact,
    result,
  };
}
