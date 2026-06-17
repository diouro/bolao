import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPoolMemberIds, getPoolMemberProfiles } from "@/lib/pools/members";
import type {
  Match,
  MatchFriendPrediction,
  MatchWithPrediction,
  Prediction,
} from "@/lib/types";

export const MATCH_FRIEND_PREDICTIONS_LIMIT = 50;

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

export async function getFriendPredictionsForMatches(
  poolId: string,
  matchIds: string[],
  perMatchLimit = MATCH_FRIEND_PREDICTIONS_LIMIT,
) {
  const predictionsByMatch = new Map<string, MatchFriendPrediction[]>();

  if (matchIds.length === 0) {
    return predictionsByMatch;
  }

  const memberIds = await getPoolMemberIds(poolId);

  if (memberIds.length === 0) {
    return predictionsByMatch;
  }

  const supabase = await createSupabaseServerClient();
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("*")
    .in("match_id", matchIds)
    .in("user_id", memberIds)
    .order("updated_at", { ascending: false })
    .limit(matchIds.length * perMatchLimit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (predictions ?? []) as Prediction[];
  const profiles = await getPoolMemberProfiles(poolId);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  for (const prediction of rows) {
    const existing = predictionsByMatch.get(prediction.match_id) ?? [];

    if (existing.length >= perMatchLimit) {
      continue;
    }

    const profile = profilesById.get(prediction.user_id);
    existing.push({
      ...prediction,
      display_name: profile?.display_name ?? null,
      email: profile?.email ?? null,
      has_paid: profile?.has_paid ?? false,
    });
    predictionsByMatch.set(prediction.match_id, existing);
  }

  predictionsByMatch.forEach((matchPredictions, matchId) => {
    predictionsByMatch.set(
      matchId,
      [...matchPredictions].sort((a, b) => {
        const aName = a.display_name ?? a.email ?? "";
        const bName = b.display_name ?? b.email ?? "";
        return aName.localeCompare(bName);
      }),
    );
  });

  return predictionsByMatch;
}
