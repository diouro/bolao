"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAppContext } from "@/lib/pools/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const commentSchema = z.object({
  matchId: z.string().min(1),
  body: z.string().trim().min(1).max(500),
});

export async function addMatchComment(formData: FormData) {
  const { profile, poolId } = await requireAppContext();
  const values = commentSchema.parse({
    matchId: formData.get("matchId"),
    body: formData.get("body"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_comments").insert({
    pool_id: poolId,
    match_id: values.matchId,
    user_id: profile.id,
    body: values.body,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/predictions");
}
