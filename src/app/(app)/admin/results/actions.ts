"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createResultsProvider } from "@/lib/results";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
});

export async function saveResult(formData: FormData) {
  await requireAdmin();
  const values = resultSchema.parse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: values.homeScore,
      away_score: values.awayScore,
      status: "finished",
    })
    .eq("id", values.matchId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/results");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
  revalidatePath("/stats");
}

export async function syncFinishedResults() {
  await requireAdmin();
  const provider = createResultsProvider();

  if (!provider.syncFinishedMatches) {
    throw new Error("The configured results provider does not support syncing.");
  }

  await provider.syncFinishedMatches();

  revalidatePath("/admin/results");
  revalidatePath("/dashboard");
  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
  revalidatePath("/stats");
}
