import { calculatePoints } from "@/lib/scoring/calculate-points";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, Prediction, Profile, ScoreBreakdown } from "@/lib/types";

export type MatchBreakdownCell = {
  match: Match;
  prediction: Prediction | null;
  score: ScoreBreakdown;
};

export type UserPointsBreakdown = {
  profile: Profile;
  totalPoints: number;
  exactHits: number;
  outcomeHits: number;
  cells: MatchBreakdownCell[];
};

export type PointsBreakdown = {
  matches: Match[];
  users: UserPointsBreakdown[];
};

export async function getPointsBreakdown(): Promise<PointsBreakdown> {
  const supabase = await createSupabaseServerClient();
  const [
    { data: profiles, error: profilesError },
    { data: matches, error: matchesError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
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
  const predictionsByUserAndMatch = new Map<string, Prediction>();

  ((predictions ?? []) as Prediction[]).forEach((prediction) => {
    predictionsByUserAndMatch.set(
      `${prediction.user_id}:${prediction.match_id}`,
      prediction,
    );
  });

  const users = ((profiles ?? []) as Profile[])
    .map((profile) => {
      const cells = finishedMatches.map((match) => {
        const prediction =
          predictionsByUserAndMatch.get(`${profile.id}:${match.id}`) ?? null;
        const score = prediction
          ? calculatePoints({
              predictionHome: prediction.home_score,
              predictionAway: prediction.away_score,
              actualHome: match.home_score,
              actualAway: match.away_score,
            })
          : {
              points: 0,
              exact: false,
              result: false,
            };

        return {
          match,
          prediction,
          score,
        };
      });

      return {
        profile,
        totalPoints: cells.reduce((sum, cell) => sum + cell.score.points, 0),
        exactHits: cells.filter((cell) => cell.score.exact).length,
        outcomeHits: cells.filter((cell) => cell.score.result && !cell.score.exact)
          .length,
        cells,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.exactHits !== a.exactHits) {
        return b.exactHits - a.exactHits;
      }

      return a.profile.email.localeCompare(b.profile.email);
    });

  return {
    matches: finishedMatches,
    users,
  };
}
