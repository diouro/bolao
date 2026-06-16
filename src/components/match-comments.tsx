import { MessageCircle } from "lucide-react";
import { MatchCommentForm } from "@/components/match-comment-form";
import { MATCH_COMMENTS_LIMIT } from "@/lib/comments";
import { getIntlLocale, t, type Locale } from "@/lib/i18n";
import type { MatchComment, MentionableUser } from "@/lib/types";

export function MatchComments({
  matchId,
  comments,
  mentionableUsers,
  currentUserId,
  locale,
}: {
  matchId: string;
  comments: MatchComment[];
  mentionableUsers: MentionableUser[];
  currentUserId: string;
  locale: Locale;
}) {
  return (
    <div className="border-t border-zinc-100 bg-white px-5 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          {t(locale, "comments.title")}
        </div>
        <div className="text-xs font-semibold text-zinc-400">
          {t(locale, "comments.latest", {
            count: Math.min(comments.length, MATCH_COMMENTS_LIMIT),
          })}
        </div>
      </div>

      <div className="max-h-56 space-y-3 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-zinc-950">
                  {comment.author_name ?? comment.author_email ?? t(locale, "common.friend")}
                </div>
                <time className="text-xs font-medium text-zinc-400">
                  {new Intl.DateTimeFormat(getIntlLocale(locale), {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(comment.created_at))}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
                {comment.body}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm">
            {t(locale, "comments.empty")}
          </div>
        )}
      </div>

      <MatchCommentForm
        matchId={matchId}
        mentionableUsers={mentionableUsers}
        currentUserId={currentUserId}
        locale={locale}
      />
    </div>
  );
}
