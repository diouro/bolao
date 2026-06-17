import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CHAT_MESSAGES_PAGE_SIZE,
  type ChatMessageWithAuthor,
} from "@/lib/chat-types";
import { getPoolMemberProfiles } from "@/lib/pools/members";
import type { ChatMessage } from "@/lib/types";

export async function getLatestChatMessages(
  poolId: string,
  limit = CHAT_MESSAGES_PAGE_SIZE,
): Promise<ChatMessageWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatAuthors(poolId, ((data ?? []) as ChatMessage[]).reverse());
}

export async function getOlderChatMessages({
  poolId,
  before,
  limit = CHAT_MESSAGES_PAGE_SIZE,
}: {
  poolId: string;
  before: string;
  limit?: number;
}): Promise<ChatMessageWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("pool_id", poolId)
    .lt("created_at", before)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateChatAuthors(poolId, ((data ?? []) as ChatMessage[]).reverse());
}

export async function getUnreadChatMessageCount(poolId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: readState, error: readError } = await supabase
    .from("chat_reads")
    .select("last_read_at")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  let query = supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("pool_id", poolId)
    .neq("user_id", userId);

  if (readState?.last_read_at) {
    query = query.gt("created_at", readState.last_read_at);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function hydrateChatAuthors(poolId: string, messages: ChatMessage[]) {
  if (messages.length === 0) {
    return [];
  }

  const profiles = await getPoolMemberProfiles(poolId);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

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
