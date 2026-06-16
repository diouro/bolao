import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CHAT_MESSAGES_PAGE_SIZE,
  type ChatMessageWithAuthor,
} from "@/lib/chat-types";
import type { ChatMessage, Profile } from "@/lib/types";

export async function getLatestChatMessages(
  limit = CHAT_MESSAGES_PAGE_SIZE,
): Promise<ChatMessageWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatAuthors(((data ?? []) as ChatMessage[]).reverse());
}

export async function getOlderChatMessages({
  before,
  limit = CHAT_MESSAGES_PAGE_SIZE,
}: {
  before: string;
  limit?: number;
}): Promise<ChatMessageWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .lt("created_at", before)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatAuthors(((data ?? []) as ChatMessage[]).reverse());
}

async function hydrateChatAuthors(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const userIds = Array.from(new Set(messages.map((message) => message.user_id)));
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  const profilesById = new Map(
    ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );

  return messages.map((message) => {
    const profile = profilesById.get(message.user_id);

    return {
      ...message,
      author_name: profile?.display_name ?? null,
      author_email: profile?.email ?? null,
      author_has_paid: profile?.has_paid ?? false,
    };
  });
}
