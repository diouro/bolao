"use server";

import { z } from "zod";
import { getOlderChatMessages } from "@/lib/chat";
import { requireUser } from "@/lib/auth";

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
