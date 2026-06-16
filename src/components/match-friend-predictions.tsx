import { Check, Users } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { MATCH_FRIEND_PREDICTIONS_LIMIT } from "@/lib/matches";
import type { MatchFriendPrediction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MatchFriendPredictions({
  predictions,
  currentUserId,
  locale,
}: {
  predictions: MatchFriendPrediction[];
  currentUserId: string;
  locale: Locale;
}) {
  const sortedPredictions = [...predictions].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;

    const aName = a.display_name ?? a.email ?? "";
    const bName = b.display_name ?? b.email ?? "";
    return aName.localeCompare(bName);
  });

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-800">
          <Users className="h-4 w-4 text-emerald-600" />
          {t(locale, "friends.predictions")}
        </div>
        <div className="text-xs font-semibold text-zinc-400">
          {predictions.length}/{MATCH_FRIEND_PREDICTIONS_LIMIT}
        </div>
      </div>

      <div className="max-h-44 overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2">
        {sortedPredictions.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {sortedPredictions.map((prediction) => {
              const isCurrentUser = prediction.user_id === currentUserId;

              return (
                <div
                  key={`${prediction.user_id}-${prediction.match_id}`}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2",
                    isCurrentUser
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-transparent bg-zinc-50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-bold text-zinc-950">
                        {prediction.display_name ??
                          prediction.email ??
                          t(locale, "common.friend")}
                      </div>
                      {prediction.has_paid && (
                        <span
                          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
                          title={t(locale, "common.paid")}
                          aria-label={t(locale, "common.paid")}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    {!isCurrentUser && prediction.email && (
                      <div className="truncate text-xs text-zinc-400">
                        {prediction.email}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 rounded-full bg-zinc-950 px-3 py-1 text-sm font-black text-white">
                    {prediction.home_score}-{prediction.away_score}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
            {t(locale, "friends.noPredictions")}
          </div>
        )}
      </div>
    </div>
  );
}
