import { calculatePoints } from "@/lib/scoring/calculate-points";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile, TournamentRound } from "@/lib/types";

export type UserStats = {
  profile: Profile;
  predictions: number;
  exactHits: number;
  resultHits: number;
  headToHeadPoints: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  bestRound: TournamentRound | null;
  boldPicks: number;
  averagePredictedGoals: number;
  averageActualGoals: number;
};

export type StatsSummary = {
  currentUser: UserStats | null;
  users: UserStats[];
  mostExact: UserStats | null;
  hottestStreak: UserStats | null;
  boldest: UserStats | null;
};

export async function computeStats(currentUserId: string): Promise<StatsSummary> {
  const supabase = await createSupabaseServerClient();
  const [
    { data: profiles, error: profilesError },
    { data: matches, error: matchesError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .order("kickoff_at", { ascending: true }),
    supabase.from("predictions").select("*"),
  ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const finishedMatches = (matches ?? []) as Match[];
  const matchMap = new Map(finishedMatches.map((match) => [match.id, match]));

  const allPredictions = (predictions ?? []) as Prediction[];
  const users = ((profiles ?? []) as Profile[]).map((profile) =>
    computeUserStats({
      profile,
      matches: finishedMatches,
      allPredictions,
      predictions: allPredictions.filter(
        (prediction) =>
          prediction.user_id === profile.id && matchMap.has(prediction.match_id),
      ),
    }),
  );

  return {
    currentUser: users.find((user) => user.profile.id === currentUserId) ?? null,
    users,
    mostExact: maxBy(users, (user) => user.exactHits),
    hottestStreak: maxBy(users, (user) => user.bestStreak),
    boldest: maxBy(users, (user) => user.boldPicks),
  };
}

function computeUserStats({
  profile,
  matches,
  predictions,
  allPredictions,
}: {
  profile: Profile;
  matches: Match[];
  predictions: Prediction[];
  allPredictions: Prediction[];
}): UserStats {
  const predictionMap = new Map(predictions.map((prediction) => [prediction.match_id, prediction]));
  const predictionsByMatch = new Map<string, Prediction[]>();
  allPredictions.forEach((prediction) => {
    predictionsByMatch.set(prediction.match_id, [
      ...(predictionsByMatch.get(prediction.match_id) ?? []),
      prediction,
    ]);
  });
  const roundTotals = new Map<TournamentRound, number>();
  let exactHits = 0;
  let resultHits = 0;
  let headToHeadPoints = 0;
  let boldPicks = 0;
  let predictedGoals = 0;
  let actualGoals = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  for (const match of matches) {
    const prediction = predictionMap.get(match.id);

    if (!prediction) {
      currentStreak = 0;
      continue;
    }

    const score = calculatePoints({
      predictionHome: prediction.home_score,
      predictionAway: prediction.away_score,
      actualHome: match.home_score,
      actualAway: match.away_score,
    });

    predictedGoals += prediction.home_score + prediction.away_score;
    actualGoals += (match.home_score ?? 0) + (match.away_score ?? 0);
    exactHits += score.exact ? 1 : 0;
    resultHits += score.result ? 1 : 0;
    roundTotals.set(match.round, (roundTotals.get(match.round) ?? 0) + score.points);
    if (hasFriendDisagreement(prediction, predictionsByMatch.get(match.id) ?? [])) {
      headToHeadPoints += score.points;
    }

    if (score.exact && Math.abs((match.home_score ?? 0) - (match.away_score ?? 0)) >= 2) {
      boldPicks += 1;
    }

    if (score.result) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const bestRound =
    Array.from(roundTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    profile,
    predictions: predictions.length,
    exactHits,
    resultHits,
    headToHeadPoints,
    accuracy: predictions.length === 0 ? 0 : Math.round((resultHits / predictions.length) * 100),
    currentStreak,
    bestStreak,
    bestRound,
    boldPicks,
    averagePredictedGoals:
      predictions.length === 0 ? 0 : roundOne(predictedGoals / predictions.length),
    averageActualGoals:
      predictions.length === 0 ? 0 : roundOne(actualGoals / predictions.length),
  };
}

function maxBy<T>(values: T[], score: (value: T) => number) {
  return values
    .filter((value) => score(value) > 0)
    .sort((a, b) => score(b) - score(a))[0] ?? null;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function hasFriendDisagreement(prediction: Prediction, matchPredictions: Prediction[]) {
  return matchPredictions.some(
    (other) =>
      other.user_id !== prediction.user_id &&
      (other.home_score !== prediction.home_score ||
        other.away_score !== prediction.away_score),
  );
}
