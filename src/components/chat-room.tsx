"use client";

import { Check, Loader2, Send } from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadOlderChatMessages } from "@/app/(app)/chat/actions";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";
import {
  CHAT_MESSAGES_PAGE_SIZE,
  type ChatMessageWithAuthor,
} from "@/lib/chat-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ChatMessage, MentionableUser, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type RealtimeStatus = "connecting" | "live";
type ActiveMention = {
  start: number;
  query: string;
};

export function ChatRoom({
  initialMessages,
  currentUserId,
  mentionableUsers,
  appTimeZone,
}: {
  initialMessages: ChatMessageWithAuthor[];
  currentUserId: string;
  mentionableUsers: MentionableUser[];
  appTimeZone: string;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialMessages.length === CHAT_MESSAGES_PAGE_SIZE,
  );
  const [onlineCount, setOnlineCount] = useState(1);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didInitialScrollRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const activeMention = getActiveMention(body, caretPosition);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        timeZone: appTimeZone,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [appTimeZone],
  );
  const mentionSuggestions = useMemo(() => {
    if (!activeMention) {
      return [];
    }

    const query = activeMention.query.toLowerCase();

    return mentionableUsers
      .filter((user) => user.id !== currentUserId)
      .filter(
        (user) =>
          user.label.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.handle.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [activeMention, currentUserId, mentionableUsers]);

  const hydrateMessages = useCallback(
    async (rawMessages: ChatMessage[]) => {
      if (rawMessages.length === 0) {
        return [];
      }

      const userIds = Array.from(
        new Set(rawMessages.map((message) => message.user_id)),
      );
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email, has_paid")
        .in("id", userIds);

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      const profilesById = new Map(
        ((profiles ?? []) as Pick<
          Profile,
          "id" | "display_name" | "email" | "has_paid"
        >[]).map((profile) => [profile.id, profile]),
      );

      return rawMessages.map((message) => {
        const profile = profilesById.get(message.user_id);

        return {
          ...message,
          author_name: profile?.display_name ?? null,
          author_email: profile?.email ?? null,
          author_has_paid: profile?.has_paid ?? false,
        };
      });
    },
    [supabase],
  );

  const mergeMessages = useCallback((incoming: ChatMessageWithAuthor[]) => {
    shouldStickToBottomRef.current = isNearBottom(scrollRef.current);
    setMessages((current) => {
      const byId = new Map(current.map((message) => [message.id, message]));

      incoming.forEach((message) => {
        byId.set(message.id, message);
      });

      return Array.from(byId.values()).sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      );
    });
  }, []);

  const fetchNewerMessages = useCallback(async () => {
    const latest = messages.at(-1);
    const query = supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(CHAT_MESSAGES_PAGE_SIZE);

    const { data, error: fetchError } = latest
      ? await query.gt("created_at", latest.created_at)
      : await query;

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    mergeMessages(await hydrateMessages((data ?? []) as ChatMessage[]));
  }, [hydrateMessages, mergeMessages, messages, supabase]);

  const loadOlder = useCallback(async () => {
    const oldest = messages[0];

    if (!oldest || isLoadingOlder || !hasMore) {
      return;
    }

    const scroller = scrollRef.current;
    const previousHeight = scroller?.scrollHeight ?? 0;

    setIsLoadingOlder(true);
    setError(null);

    try {
      const olderMessages = await loadOlderChatMessages({
        before: oldest.created_at,
      });

      setHasMore(olderMessages.length === CHAT_MESSAGES_PAGE_SIZE);
      mergeMessages(olderMessages);

      window.requestAnimationFrame(() => {
        if (!scroller) {
          return;
        }

        scroller.scrollTop += scroller.scrollHeight - previousHeight;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load messages.");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasMore, isLoadingOlder, mergeMessages, messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = body.trim();

    if (!trimmed) {
      return;
    }

    setIsSending(true);
    setError(null);

    shouldStickToBottomRef.current = true;

    const { error: insertError } = await supabase.from("chat_messages").insert({
      user_id: currentUserId,
      body: trimmed,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSending(false);
      return;
    }

    setBody("");
    setCaretPosition(0);
    setIsSending(false);
  }

  function updateCaret() {
    setCaretPosition(textareaRef.current?.selectionStart ?? 0);
  }

  function insertMention(user: MentionableUser) {
    if (!activeMention) {
      return;
    }

    const before = body.slice(0, activeMention.start);
    const after = body.slice(caretPosition);
    const mention = `@${user.handle} `;
    const nextBody = `${before}${mention}${after}`;
    const nextCaret = before.length + mention.length;

    setBody(nextBody);
    setCaretPosition(nextCaret);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  useEffect(() => {
    const channel = supabase
      .channel("chat-room", {
        config: {
          presence: {
            key: currentUserId,
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          try {
            mergeMessages(
              await hydrateMessages([payload.new as ChatMessage]),
            );
          } catch (realtimeError) {
            setError(
              realtimeError instanceof Error
                ? realtimeError.message
                : "Could not load realtime message.",
            );
          }
        },
      )
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        setRealtimeStatus(status === "SUBSCRIBED" ? "live" : "connecting");

        if (status === "SUBSCRIBED") {
          void channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, hydrateMessages, mergeMessages, supabase]);

  useEffect(() => {
    if (realtimeStatus === "live") {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchNewerMessages();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [fetchNewerMessages, realtimeStatus]);

  useEffect(() => {
    if (didInitialScrollRef.current || !scrollRef.current) {
      return;
    }

    didInitialScrollRef.current = true;
    const target = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;

    if (target) {
      target.scrollIntoView({ block: "center" });
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      bottomSentinelRef.current?.scrollIntoView({ block: "end" });
    });
  }, [messages.length]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const scroller = scrollRef.current;

    if (!sentinel || !scroller) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadOlder();
        }
      },
      {
        root: scroller,
        rootMargin: "160px 0px 0px 0px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadOlder]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-black text-zinc-950">Pool chat</h2>
          <p className="text-sm text-zinc-500">
            {realtimeStatus === "live"
              ? "Live with Supabase Realtime"
              : "Reconnecting, checking every 10 seconds"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {onlineCount} online
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              realtimeStatus === "live"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            )}
          >
            {realtimeStatus === "live" ? "Live" : "Polling"}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[62vh] space-y-3 overflow-y-auto bg-zinc-50/70 px-4 py-4 sm:px-6"
      >
        <div ref={topSentinelRef} />
        {isLoadingOlder && (
          <div className="flex justify-center py-2 text-sm font-semibold text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading earlier messages
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Start of chat
          </div>
        )}
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
              time={timeFormatter.format(new Date(message.created_at))}
            />
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            No messages yet. Start the pool chat.
          </div>
        )}
        <div ref={bottomSentinelRef} />
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 sm:px-6">
          {error}
        </div>
      )}

      <form
        onSubmit={sendMessage}
        className="flex flex-col gap-3 border-t border-zinc-100 bg-white px-5 py-4 sm:flex-row sm:px-6"
      >
        <label className="sr-only" htmlFor="chat-message">
          Chat message
        </label>
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            id="chat-message"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setCaretPosition(event.target.selectionStart);
            }}
            onClick={updateCaret}
            onKeyUp={updateCaret}
            maxLength={1000}
            required
            placeholder="Write a message... type @ to mention a friend"
            className="min-h-12 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          {mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
              {mentionSuggestions.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(user);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-zinc-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-zinc-950">
                      {user.label}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      @{user.handle}
                    </span>
                  </span>
                  {user.has_paid && (
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          disabled={isSending}
          className="h-12 bg-emerald-600 px-5 hover:bg-emerald-700"
          pendingChildren="Sending"
        >
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </form>
    </Card>
  );
}

function ChatBubble({
  message,
  isOwn,
  time,
}: {
  message: ChatMessageWithAuthor;
  isOwn: boolean;
  time: string;
}) {
  return (
    <div
      id={`message-${message.id}`}
      className={cn("scroll-mt-24 flex", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[70%]",
          isOwn ? "bg-emerald-600 text-white" : "bg-white text-zinc-950",
        )}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-black">
            {isOwn
              ? "You"
              : message.author_name ?? message.author_email ?? "Friend"}
          </span>
          {message.author_has_paid && (
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full",
                isOwn ? "bg-white text-emerald-700" : "bg-emerald-600 text-white",
              )}
              title="Paid"
              aria-label="Paid"
            >
              <Check className="h-3 w-3" />
            </span>
          )}
          <time
            className={cn(
              "text-xs font-semibold",
              isOwn ? "text-emerald-100" : "text-zinc-400",
            )}
          >
            {time}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {message.body}
        </p>
      </div>
    </div>
  );
}

function getActiveMention(value: string, caretPosition: number): ActiveMention | null {
  const beforeCaret = value.slice(0, caretPosition);
  const match = beforeCaret.match(/(^|\s)@([a-zA-Z0-9_]*)$/);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    start: match.index + match[1].length,
    query: match[2],
  };
}

function isNearBottom(element: HTMLDivElement | null) {
  if (!element) {
    return true;
  }

  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;

  return distanceFromBottom < 120;
}
