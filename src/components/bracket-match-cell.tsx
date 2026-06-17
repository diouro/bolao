import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { formatAppDateTime } from "@/lib/dates";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { hasMatchResult } from "@/lib/tournament/knockout-bracket";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

const roundLabelKeys: Record<string, TranslationKey> = {
  round_of_32: "round.round_of_32",
  round_of_16: "round.round_of_16",
  quarter_final: "round.quarter_final",
  semi_final: "round.semi_final",
  third_place: "round.third_place",
  final: "round.final",
};

export function BracketMatchCell({
  match,
  locale,
  highlight = false,
  compact = false,
  className,
}: {
  match: Match;
  locale: Locale;
  highlight?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const home = resolveMatchSide(match, "home");
  const away = resolveMatchSide(match, "away");
  const hasResult = hasMatchResult(match);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished" || hasResult;
  const predictionsHref =
    match.round === "group" && match.group_code
      ? `/predictions?group=${match.group_code}#match-${match.id}`
      : `/predictions?group=${match.round}#match-${match.id}`;

  return (
    <Link
      href={predictionsHref}
      className={cn(
        "box-border block min-w-0 rounded-xl border bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md",
        compact ? "p-2" : "p-2.5",
        highlight && "border-emerald-500 ring-2 ring-emerald-500/20",
        isFinished && "border-zinc-200 bg-zinc-50/80",
        isLive && !isFinished && "border-emerald-300 bg-emerald-50/50",
        className,
      )}
    >
      {!compact && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            {t(locale, roundLabelKeys[match.round] ?? "common.match")}
          </span>
          {isLive && !isFinished && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {t(locale, "match.live")}
            </span>
          )}
        </div>
      )}

      {compact && isLive && !isFinished && (
        <div className="mb-1.5 flex justify-end">
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {t(locale, "match.live")}
          </span>
        </div>
      )}

      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        <BracketTeam
          side={home}
          score={hasResult ? match.home_score : null}
          isWinner={
            hasResult &&
            match.home_score !== null &&
            match.away_score !== null &&
            match.home_score > match.away_score
          }
        />
        <BracketTeam
          side={away}
          score={hasResult ? match.away_score : null}
          isWinner={
            hasResult &&
            match.home_score !== null &&
            match.away_score !== null &&
            match.away_score > match.home_score
          }
        />
      </div>

      <time
        className={cn(
          "block font-medium text-zinc-400",
          compact ? "mt-1.5 text-[9px] leading-tight" : "mt-2 text-[10px]",
        )}
      >
        {formatAppDateTime(match.kickoff_at)}
      </time>
    </Link>
  );
}

function BracketTeam({
  side,
  score,
  isWinner,
}: {
  side: ReturnType<typeof resolveMatchSide>;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-1 py-0.5",
        isWinner && "bg-emerald-50 font-bold",
      )}
    >
      <CountryFlag
        code={side.code}
        slot={side.slot}
        className="h-4 w-6 shrink-0 rounded object-cover shadow-sm ring-1 ring-zinc-200"
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[11px] leading-tight text-zinc-800",
          side.isPlaceholder && "text-zinc-500",
        )}
      >
        {side.code ?? side.name}
      </span>
      <span className="w-4 shrink-0 text-right text-[11px] font-black tabular-nums text-zinc-700">
        {score ?? "-"}
      </span>
    </div>
  );
}
