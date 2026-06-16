"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const commentSchema = z.object({
  matchId: z.string().min(1),
  body: z.string().trim().min(1).max(500),
});

export async function addMatchComment(formData: FormData) {
  const user = await requireUser();
  const values = commentSchema.parse({
    matchId: formData.get("matchId"),
    body: formData.get("body"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_comments").insert({
    match_id: values.matchId,
    user_id: user.id,
    body: values.body,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/predictions");
}
