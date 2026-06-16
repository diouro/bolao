"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearMention,
  clearMentions,
  getMentionLogs,
  type MentionSource,
} from "@/lib/mentions";
import { requireProfile } from "@/lib/auth";

const clearMentionSchema = z.object({
  source: z.enum(["chat", "match_comment"]),
  sourceId: z.string().uuid(),
});

export async function clearSingleMention(input: {
  source: MentionSource;
  sourceId: string;
}) {
  const profile = await requireProfile();
  const values = clearMentionSchema.parse(input);

  await clearMention({
    userId: profile.id,
    source: values.source,
    sourceId: values.sourceId,
  });

  revalidatePath("/mentions");
}

export async function clearAllMentions() {
  const profile = await requireProfile();
  const mentions = await getMentionLogs(profile);

  await clearMentions({
    userId: profile.id,
    mentions,
  });

  revalidatePath("/mentions");
}
