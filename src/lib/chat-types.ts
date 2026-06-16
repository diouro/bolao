import type { ChatMessage } from "@/lib/types";

export const CHAT_MESSAGES_PAGE_SIZE = 30;

export type ChatMessageWithAuthor = ChatMessage & {
  author_name: string | null;
  author_email: string | null;
  author_has_paid: boolean;
};
