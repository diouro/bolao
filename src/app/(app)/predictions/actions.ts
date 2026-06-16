"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
});

export async function savePrediction(formData: FormData) {
  const user = await requireUser();
  const values = predictionSchema.parse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });

  const supabase = await createSupabaseServerClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("kickoff_at")
    .eq("id", values.matchId)
    .single();

  if (matchError) {
    throw new Error(matchError.message);
  }

  if (new Date(match.kickoff_at).getTime() <= Date.now()) {
    throw new Error("Predictions are locked after kickoff.");
  }

  const { error } = await supabase.from("predictions").upsert({
    user_id: user.id,
    match_id: values.matchId,
    home_score: values.homeScore,
    away_score: values.awayScore,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
  revalidatePath("/stats");
}
