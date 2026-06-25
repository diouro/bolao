"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revalidateAfterMatchResultsSync } from "@/lib/results/revalidate-after-sync";
import { runMatchResultsSync } from "@/lib/results/run-match-results-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const resultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
});

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

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

  revalidateAfterMatchResultsSync();
}

export async function syncFinishedResults() {
  await requireAdmin();

  try {
    const summary = await runMatchResultsSync({ revalidate: false });
    revalidateAfterMatchResultsSync();

    redirect(
      `/admin/results?${new URLSearchParams({
        syncUpdated: String(summary.updated),
        syncChecked: String(summary.checked),
        syncSkipped: String(summary.skipped),
      }).toString()}`,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unable to sync finished scores.";

    redirect(
      `/admin/results?${new URLSearchParams({
        syncError: message,
      }).toString()}`,
    );
  }
}
