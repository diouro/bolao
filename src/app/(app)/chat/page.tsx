import { ChatRoom } from "@/components/chat-room";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { getLatestChatMessages } from "@/lib/chat";
import { CHAT_MESSAGES_PAGE_SIZE } from "@/lib/chat-types";
import { getAppTimeZone } from "@/lib/env";
import { getMentionableUsers } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const profile = await requireProfile();
  const [messages, mentionableUsers] = await Promise.all([
    getLatestChatMessages(CHAT_MESSAGES_PAGE_SIZE),
    getMentionableUsers(),
  ]);

  return (
    <AppShell profile={profile} active="chat">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Chat
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Pool chat room
        </h1>
      </div>

      <ChatRoom
        initialMessages={messages}
        currentUserId={profile.id}
        mentionableUsers={mentionableUsers}
        appTimeZone={getAppTimeZone()}
      />
    </AppShell>
  );
}
