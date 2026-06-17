"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOlderChatMessages } from "@/lib/chat";
import { requireAppContext } from "@/lib/pools/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const olderMessagesSchema = z.object({
  before: z.string().min(1),
});

export async function loadOlderChatMessages(input: { before: string }) {
  const { poolId } = await requireAppContext();
  const values = olderMessagesSchema.parse(input);

  return getOlderChatMessages({
    poolId,
    before: values.before,
  });
}

export async function markChatRead() {
  const { profile, poolId } = await requireAppContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("chat_reads").upsert(
    {
      pool_id: poolId,
      user_id: profile.id,
      last_read_at: new Date().toISOString(),
    },
    {
      onConflict: "pool_id,user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/chat");
}
