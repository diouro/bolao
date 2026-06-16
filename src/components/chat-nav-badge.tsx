"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type ChatMessagePayload = {
  id?: string;
  user_id?: string;
};

export function ChatNavBadge({
  initialCount,
  currentUserId,
  channelKey,
  disabled = false,
  className,
}: {
  initialCount: number;
  currentUserId: string;
  channelKey: string;
  disabled?: boolean;
  className?: string;
}) {
  const [count, setCount] = useState(disabled ? 0 : initialCount);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const seenMessageIds = new Set<string>();
    const channel = supabase
      .channel(`chat-badge-${currentUserId}-${channelKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const message = payload.new as ChatMessagePayload;

          if (
            !message.id ||
            message.user_id === currentUserId ||
            seenMessageIds.has(message.id)
          ) {
            return;
          }

          seenMessageIds.add(message.id);
          setCount((current) => current + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_reads",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => setCount(0),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelKey, currentUserId, disabled]);

  if (disabled || count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
