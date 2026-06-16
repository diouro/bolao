"use client";

import { Check } from "lucide-react";
import { useActionState, useMemo, useRef, useState } from "react";
import { addMatchComment } from "@/app/(app)/comments/actions";
import { Button } from "@/components/button";
import { t, type Locale } from "@/lib/i18n";
import type { MentionableUser } from "@/lib/types";

type ActiveMention = {
  start: number;
  query: string;
};

export function MatchCommentForm({
  matchId,
  mentionableUsers,
  currentUserId,
  locale,
}: {
  matchId: string;
  mentionableUsers: MentionableUser[];
  currentUserId: string;
  locale: Locale;
}) {
  const [value, setValue] = useState("");
  const [caretPosition, setCaretPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, formAction] = useActionState(
    async (_previousState: null, formData: FormData) => {
      await addMatchComment(formData);
      setValue("");
      setCaretPosition(0);
      return null;
    },
    null,
  );
  const activeMention = getActiveMention(value, caretPosition);
  const suggestions = useMemo(() => {
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

  function updateCaret() {
    setCaretPosition(textareaRef.current?.selectionStart ?? 0);
  }

  function insertMention(user: MentionableUser) {
    if (!activeMention) {
      return;
    }

    const before = value.slice(0, activeMention.start);
    const after = value.slice(caretPosition);
    const mention = `@${user.handle} `;
    const nextValue = `${before}${mention}${after}`;
    const nextCaret = before.length + mention.length;

    setValue(nextValue);
    setCaretPosition(nextCaret);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  return (
    <form action={formAction} className="relative mt-3 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="matchId" value={matchId} />
      <label className="sr-only" htmlFor={`${matchId}-comment`}>
        Add a comment
      </label>
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          id={`${matchId}-comment`}
          name="body"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setCaretPosition(event.target.selectionStart);
          }}
          onClick={updateCaret}
          onKeyUp={updateCaret}
          maxLength={500}
          required
          placeholder={t(locale, "comments.placeholder")}
          className="min-h-11 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
        />
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
            {suggestions.map((user) => (
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
        className="h-11 bg-emerald-600 px-5 hover:bg-emerald-700"
        pendingChildren={t(locale, "comments.posting")}
      >
        {t(locale, "comments.post")}
      </Button>
    </form>
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
