import { calculatePoints } from "@/lib/scoring/calculate-points";
import { getPoolMemberProfiles } from "@/lib/pools/members";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, PoolMemberProfile, Prediction } from "@/lib/types";

export const ENTRY_PRICE_DOLLARS = 5;

export type LeaderboardRow = {
  rank: number;
  profile: PoolMemberProfile;
  totalPoints: number;
  exactHits: number;
  resultHits: number;
  predictions: number;
};

export type Leaderboard = {
  rows: LeaderboardRow[];
  paidPlayers: number;
  prizePoolDollars: number;
};

export async function getLeaderboard(poolId: string): Promise<Leaderboard> {
  const supabase = await createSupabaseServerClient();
  const [
    profiles,
    { data: matches, error: matchesError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    getPoolMemberProfiles(poolId),
    supabase.from("matches").select("*").eq("status", "finished"),
    supabase.from("predictions").select("*"),
  ]);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const memberIds = new Set(profiles.map((profile) => profile.id));
  const matchMap = new Map(
    ((matches ?? []) as Match[]).map((match) => [match.id, match]),
  );

  const rows = profiles.map((profile) => {
    const userPredictions = ((predictions ?? []) as Prediction[]).filter(
      (prediction) =>
        prediction.user_id === profile.id &&
        memberIds.has(prediction.user_id) &&
        matchMap.has(prediction.match_id),
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
      new Date(a.profile.pool_joined_at).getTime() -
      new Date(b.profile.pool_joined_at).getTime()
    );
  });

  const rankedRows = rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  })) satisfies LeaderboardRow[];
  const paidPlayers = profiles.filter((profile) => profile.has_paid).length;

  return {
    rows: rankedRows,
    paidPlayers,
    prizePoolDollars: paidPlayers * ENTRY_PRICE_DOLLARS,
  };
}
