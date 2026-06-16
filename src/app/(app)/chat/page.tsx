import { ChatRoom } from "@/components/chat-room";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { getLatestChatMessages } from "@/lib/chat";
import { CHAT_MESSAGES_PAGE_SIZE } from "@/lib/chat-types";
import { getAppTimeZone } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getMentionableUsers } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const profile = await requireProfile();
  const locale = await getLocale();
  const [messages, mentionableUsers] = await Promise.all([
    getLatestChatMessages(CHAT_MESSAGES_PAGE_SIZE),
    getMentionableUsers(),
  ]);

  return (
    <AppShell profile={profile} active="chat">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "app.chat")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "chat.title")}
        </h1>
      </div>

      <ChatRoom
        initialMessages={messages}
        currentUserId={profile.id}
        mentionableUsers={mentionableUsers}
        appTimeZone={getAppTimeZone()}
        locale={locale}
      />
    </AppShell>
  );
}
