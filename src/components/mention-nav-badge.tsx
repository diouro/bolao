"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MentionPayload = {
  id?: string;
  body?: string;
};

type ClearPayload = {
  source?: string;
  source_id?: string;
};

export function MentionNavBadge({
  initialCount,
  handle,
  currentUserId,
}: {
  initialCount: number;
  handle: string;
  currentUserId: string;
}) {
  const [count, setCount] = useState(initialCount);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const mentionRegex = new RegExp(
      `(^|\\s)@${escapeRegExp(handle)}(?=\\s|$|[,.!?])`,
      "i",
    );

    function maybeIncrement(source: string, payload: MentionPayload) {
      if (!payload.id || !payload.body || !mentionRegex.test(payload.body)) {
        return;
      }

      const key = `${source}:${payload.id}`;

      if (seenIds.current.has(key)) {
        return;
      }

      seenIds.current.add(key);
      setCount((current) => current + 1);
    }

    function maybeDecrement(payload: ClearPayload) {
      if (!payload.source || !payload.source_id) {
        return;
      }

      seenIds.current.delete(`${payload.source}:${payload.source_id}`);
      setCount((current) => Math.max(0, current - 1));
    }

    const channel = supabase
      .channel(`mentions-badge-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => maybeIncrement("chat", payload.new as MentionPayload),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_comments",
        },
        (payload) =>
          maybeIncrement("match_comment", payload.new as MentionPayload),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mention_clears",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => maybeDecrement(payload.new as ClearPayload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, handle]);

  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
