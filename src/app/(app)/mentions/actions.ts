"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearMention,
  clearMentions,
  getMentionLogs,
  type MentionSource,
} from "@/lib/mentions";
import { requireAppContext } from "@/lib/pools/context";

const clearMentionSchema = z.object({
  source: z.enum(["chat", "match_comment"]),
  sourceId: z.string().uuid(),
});

export async function clearSingleMention(input: {
  source: MentionSource;
  sourceId: string;
}) {
  const { profile, poolId } = await requireAppContext();
  const values = clearMentionSchema.parse(input);

  await clearMention({
    userId: profile.id,
    poolId,
    source: values.source,
    sourceId: values.sourceId,
  });

  revalidatePath("/mentions");
}

export async function clearAllMentions() {
  const { profile, poolId } = await requireAppContext();
  const mentions = await getMentionLogs(profile, poolId);

  await clearMentions({
    userId: profile.id,
    poolId,
    mentions,
  });

  revalidatePath("/mentions");
}
