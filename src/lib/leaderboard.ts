import { calculatePoints } from "@/lib/scoring/calculate-points";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile } from "@/lib/types";

export type LeaderboardRow = {
  rank: number;
  profile: Profile;
  totalPoints: number;
  exactHits: number;
  resultHits: number;
  predictions: number;
};

export async function getLeaderboard() {
  const supabase = await createSupabaseServerClient();
  const [
    { data: profiles, error: profilesError },
    { data: matches, error: matchesError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("matches").select("*").eq("status", "finished"),
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

  const matchMap = new Map(
    ((matches ?? []) as Match[]).map((match) => [match.id, match]),
  );

  const rows = ((profiles ?? []) as Profile[]).map((profile) => {
    const userPredictions = ((predictions ?? []) as Prediction[]).filter(
      (prediction) => prediction.user_id === profile.id && matchMap.has(prediction.match_id),
    );

    const totals = userPredictions.reduce(
      (acc, prediction) => {
        const match = matchMap.get(prediction.match_id);

        if (!match) {
          return acc;
        }

        const score = calculatePoints({
          predictionHome: prediction.home_score,
          predictionAway: prediction.away_score,
          actualHome: match.home_score,
          actualAway: match.away_score,
        });

        return {
          totalPoints: acc.totalPoints + score.points,
          exactHits: acc.exactHits + (score.exact ? 1 : 0),
          resultHits: acc.resultHits + (score.result ? 1 : 0),
        };
      },
      { totalPoints: 0, exactHits: 0, resultHits: 0 },
    );

    return {
      rank: 0,
      profile,
      totalPoints: totals.totalPoints,
      exactHits: totals.exactHits,
      resultHits: totals.resultHits,
      predictions: userPredictions.length,
    };
  });

  rows.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.exactHits !== a.exactHits) {
      return b.exactHits - a.exactHits;
    }

    return (
      new Date(a.profile.created_at).getTime() -
      new Date(b.profile.created_at).getTime()
    );
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  })) satisfies LeaderboardRow[];
}
