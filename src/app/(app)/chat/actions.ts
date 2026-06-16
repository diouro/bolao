"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOlderChatMessages } from "@/lib/chat";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const olderMessagesSchema = z.object({
  before: z.string().min(1),
});

export async function loadOlderChatMessages(input: { before: string }) {
  await requireUser();
  const values = olderMessagesSchema.parse(input);

  return getOlderChatMessages({
    before: values.before,
  });
}

export async function markChatRead() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("chat_reads").upsert(
    {
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/chat");
}
