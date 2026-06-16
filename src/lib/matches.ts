import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match, MatchWithPrediction, Prediction } from "@/lib/types";

export async function getMatchesWithUserPredictions(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: matches, error: matchesError }, { data: predictions, error: predictionsError }] =
    await Promise.all([
      supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
      supabase.from("predictions").select("*").eq("user_id", userId),
    ]);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const predictionMap = new Map(
    ((predictions ?? []) as Prediction[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ]),
  );

  return ((matches ?? []) as Match[]).map((match) => ({
    ...match,
    prediction: predictionMap.get(match.id) ?? null,
  })) satisfies MatchWithPrediction[];
}

export async function getAllMatches() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Match[];
}

export async function getAllPredictions() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("predictions").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Prediction[];
}
