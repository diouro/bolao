import { savePrediction } from "@/app/(app)/predictions/actions";
import { Button } from "@/components/button";
import { CountryFlag } from "@/components/country-flag";
import { MatchComments } from "@/components/match-comments";
import { MatchFriendPredictions } from "@/components/match-friend-predictions";
import { PendingForm } from "@/components/pending-form";
import { Badge, Card, Input } from "@/components/ui";
import { formatAppDateTime } from "@/lib/dates";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { isPredictionEditable } from "@/lib/predictions/lock";
import { calculatePoints } from "@/lib/scoring/calculate-points";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import type { DashboardMatchPhase } from "@/lib/match-day";
import type {
  MatchComment,
  MatchFriendPrediction,
  MatchWithPrediction,
  MentionableUser,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const roundLabelKeys: Record<string, TranslationKey> = {
  group: "common.group",
  round_of_32: "round.round_of_32",
  round_of_16: "round.round_of_16",
  quarter_final: "round.quarter_final",
  semi_final: "round.semi_final",
  third_place: "round.third_place",
  final: "round.final",
};

export function MatchCard({
  match,
  lockMinutes,
  appearance = "default",
  comments = [],
  friendPredictions = [],
  mentionableUsers = [],
  currentUserId,
  locale,
}: {
  match: MatchWithPrediction;
  lockMinutes: number;
  appearance?: DashboardMatchPhase | "default";
  comments?: MatchComment[];
  friendPredictions?: MatchFriendPrediction[];
  mentionableUsers?: MentionableUser[];
  currentUserId: string;
  locale: Locale;
}) {
  const home = resolveMatchSide(match, "home", locale);
  const away = resolveMatchSide(match, "away", locale);
  const locked = !isPredictionEditable({
    kickoffAt: match.kickoff_at,
    lockMinutes,
  });
  const hasStarted = new Date(match.kickoff_at).getTime() <= new Date().getTime();
  const hasResultScore =
    match.home_score !== null && match.away_score !== null;
  const hasSavedPrediction = Boolean(match.prediction);
  const points = match.prediction
    ? calculatePoints({
        predictionHome: match.prediction.home_score,
        predictionAway: match.prediction.away_score,
        actualHome: match.home_score,
        actualAway: match.away_score,
      })
    : null;

  const isLive = appearance === "live";
  const isFinished = appearance === "finished";

  return (
    <div id={`match-${match.id}`} className="scroll-mt-28">
      <Card
        className={cn(
          "overflow-hidden p-0",
          isLive && "ring-2 ring-emerald-500/25",
          isFinished && "border-zinc-200/80 bg-zinc-100/40",
        )}
      >
      <div
        className={cn(
          "border-b px-5 py-4 sm:px-6",
          isLive &&
            "border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80",
          isFinished &&
            "border-zinc-200/80 bg-gradient-to-r from-zinc-100/90 via-zinc-50/90 to-zinc-100/90",
          !isLive &&
            !isFinished &&
            "border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Badge className="bg-white shadow-sm">
              {t(locale, roundLabelKeys[match.round] ?? "common.match")}
            </Badge>
            {match.group_code && (
              <Badge className="bg-emerald-50 text-emerald-700">
                {t(locale, "common.group")} {match.group_code}
              </Badge>
            )}
            {isLive && (
              <Badge className="bg-emerald-600 text-white">
                {t(locale, "match.live")}
              </Badge>
            )}
          </div>
          <time className="text-sm font-semibold text-zinc-500">
            {formatAppDateTime(match.kickoff_at)}
          </time>
        </div>
      </div>

      {locked ? (
        <>
          <MatchBody
            home={home}
            away={away}
            status={match.status}
            hasStarted={hasStarted}
            hasResultScore={hasResultScore}
            homeScore={match.home_score}
            awayScore={match.away_score}
            homePrediction={match.prediction?.home_score ?? null}
            awayPrediction={match.prediction?.away_score ?? null}
            locale={locale}
          />
          <MatchFooter
            points={points}
            status={match.status}
            hasSavedPrediction={hasSavedPrediction}
            locked
            muted={isFinished}
            locale={locale}
          />
        </>
      ) : (
        <PendingForm action={savePrediction}>
          <input type="hidden" name="matchId" value={match.id} />
          <MatchBody
            home={home}
            away={away}
            status={match.status}
            hasStarted={hasStarted}
            hasResultScore={hasResultScore}
            homeScore={match.home_score}
            awayScore={match.away_score}
            editable
            homePrediction={match.prediction?.home_score ?? null}
            awayPrediction={match.prediction?.away_score ?? null}
            matchId={match.id}
            locale={locale}
          />
          <MatchFooter
            points={points}
            status={match.status}
            hasSavedPrediction={hasSavedPrediction}
            muted={isFinished}
            locale={locale}
          />
        </PendingForm>
      )}
      <MatchFriendPredictions
        predictions={friendPredictions}
        currentUserId={currentUserId}
        locale={locale}
      />
      <MatchComments
        matchId={match.id}
        comments={comments}
        mentionableUsers={mentionableUsers}
        currentUserId={currentUserId}
        locale={locale}
      />
      </Card>
    </div>
  );
}

function MatchBody({
  home,
  away,
  status,
  hasStarted,
  hasResultScore,
  homeScore,
  awayScore,
  editable = false,
  homePrediction,
  awayPrediction,
  matchId,
  locale,
}: {
  home: ReturnType<typeof resolveMatchSide>;
  away: ReturnType<typeof resolveMatchSide>;
  status: MatchWithPrediction["status"];
  hasStarted: boolean;
  hasResultScore: boolean;
  homeScore: number | null;
  awayScore: number | null;
  editable?: boolean;
  homePrediction: number | null;
  awayPrediction: number | null;
  matchId?: string;
  locale: Locale;
}) {
  return (
    <div className="px-5 py-6 sm:grid sm:grid-cols-[minmax(0,1fr)_5rem_auto_5rem_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-6">
      <div className="grid grid-cols-2 items-start gap-4 sm:contents">
        <div className="sm:order-1">
          <TeamSide name={home.name} code={home.code} slot={home.slot} />
        </div>
        <div className="sm:order-5">
          <TeamSide
            name={away.name}
            code={away.code}
            slot={away.slot}
            align="right"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:contents">
        <div className="sm:order-2">
          <PredictionScoreBox
            side="home"
            editable={editable}
            matchId={matchId}
            value={homePrediction}
          />
        </div>
        <div className="sm:order-3">
          <MatchStatus
            status={status}
            hasStarted={hasStarted}
            hasResultScore={hasResultScore}
            homeScore={homeScore}
            awayScore={awayScore}
            locale={locale}
          />
        </div>
        <div className="sm:order-4">
          <PredictionScoreBox
            side="away"
            editable={editable}
            matchId={matchId}
            value={awayPrediction}
          />
        </div>
      </div>
    </div>
  );
}

function MatchStatus({
  status,
  hasStarted,
  hasResultScore,
  homeScore,
  awayScore,
  locale,
}: {
  status: MatchWithPrediction["status"];
  hasStarted: boolean;
  hasResultScore: boolean;
  homeScore: number | null;
  awayScore: number | null;
  locale: Locale;
}) {
  const showAwaitingScore =
    hasStarted && !hasResultScore && status !== "finished";

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-3xl border border-zinc-200 bg-zinc-950 px-4 py-3 text-center text-white shadow-sm sm:min-w-28">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          {hasResultScore
            ? t(locale, "match.fullTime")
            : hasStarted
              ? t(locale, "match.status")
              : t(locale, "common.match")}
        </div>
        <div className="mt-1 text-lg font-black sm:text-2xl">
          {hasResultScore
            ? `${homeScore}-${awayScore}`
            : hasStarted
              ? t(locale, "common.tbd")
              : "vs"}
        </div>
      </div>
      {showAwaitingScore && (
        <div className="mt-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          {t(locale, "match.awaitingScore")}
        </div>
      )}
    </div>
  );
}

function PredictionScoreBox({
  side,
  editable,
  matchId,
  value,
}: {
  side: "home" | "away";
  editable: boolean;
  matchId?: string;
  value: number | null;
}) {
  const name = side === "home" ? "homeScore" : "awayScore";

  if (!editable) {
    return (
      <div className="flex justify-center">
        <div className="flex h-14 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-xl font-black text-zinc-700 shadow-sm sm:h-16 sm:w-20">
          {value ?? "-"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <label className="sr-only" htmlFor={`${matchId}-${side}`}>
        {side === "home" ? "Home score" : "Away score"}
      </label>
      <Input
        id={`${matchId}-${side}`}
        name={name}
        type="number"
        min={0}
        max={30}
        defaultValue={value ?? ""}
        className="mt-0 h-14 w-16 rounded-2xl border-zinc-300 bg-white text-center text-xl font-black shadow-sm sm:h-16 sm:w-20"
        required
      />
    </div>
  );
}

function MatchFooter({
  points,
  status,
  hasSavedPrediction,
  locked = false,
  muted = false,
  locale,
}: {
  points: ReturnType<typeof calculatePoints> | null;
  status: string;
  hasSavedPrediction: boolean;
  locked?: boolean;
  muted?: boolean;
  locale: Locale;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        muted
          ? "border-zinc-200/80 bg-zinc-100/70"
          : "border-zinc-100 bg-zinc-50/70",
      )}
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {t(locale, "match.yourPrediction")}
        </div>
        <div className="mt-1 text-sm font-semibold text-zinc-600">
          {locked
            ? hasSavedPrediction
              ? t(locale, "match.lockedIn")
              : t(locale, "match.noPrediction")
            : hasSavedPrediction
              ? t(locale, "match.youCanUpdate")
              : t(locale, "match.inputHint")}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {points && status === "finished" && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span className="text-lg font-black">{points.points}</span> pts
            <span className="ml-1">
              {points.exact
                ? t(locale, "match.exactScore")
                : points.result
                  ? t(locale, "match.resultHit")
                  : ""}
            </span>
          </div>
        )}
        {!locked && (
          <Button
            className={
              hasSavedPrediction
                ? "h-12 bg-amber-500 px-6 text-zinc-950 hover:bg-amber-400"
                : "h-12 bg-emerald-600 px-6 hover:bg-emerald-700"
            }
            pendingChildren={
              hasSavedPrediction ? t(locale, "match.updating") : t(locale, "common.saving")
            }
          >
            {hasSavedPrediction ? t(locale, "match.update") : t(locale, "common.save")}
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamSide({
  name,
  code,
  slot,
  align = "left",
}: {
  name: string;
  code: string | null;
  slot: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex min-w-0 flex-col items-end gap-2 text-right sm:flex-row-reverse sm:gap-3"
          : "flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"
      }
    >
      <CountryFlag
        code={code}
        slot={slot}
        className="h-10 w-14 rounded-xl object-cover shadow-sm ring-1 ring-zinc-200"
      />
      <div className="min-w-0">
        <div className="max-w-32 truncate text-base font-black text-zinc-950 sm:max-w-none sm:text-xl">
          {name}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {code ?? slot ?? "TBD"}
        </div>
      </div>
    </div>
  );
}
