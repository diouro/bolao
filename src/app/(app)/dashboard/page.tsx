import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchCommentsForMatches } from "@/lib/comments";
import {
  getDashboardMatchPhase,
  getMatchesForNextMatchDay,
  sortDashboardMatches,
} from "@/lib/match-day";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import {
  getFriendPredictionsForMatches,
  getMatchesWithUserPredictions,
} from "@/lib/matches";
import { isPredictionEditable } from "@/lib/predictions/lock";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import { getMentionableUsers } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const locale = await getLocale();
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const now = new Date();
  const upcoming = sortDashboardMatches(
    getMatchesForNextMatchDay(matches, now),
    now,
  );
  const editableMatches = upcoming.filter((match) =>
    isPredictionEditable({
      kickoffAt: match.kickoff_at,
      lockMinutes,
      now,
    })
  );
  const commentsByMatch = await getMatchCommentsForMatches(
    upcoming.map((match) => match.id)
  );
  const mentionableUsers = await getMentionableUsers();
  const friendPredictionsByMatch = await getFriendPredictionsForMatches(
    upcoming.map((match) => match.id)
  );
  const missingPicks = editableMatches.filter((match) => !match.prediction).length;
  const picksMade = upcoming.filter((match) => match.prediction).length;
  const activeMatches = upcoming.filter(
    (match) => getDashboardMatchPhase(match, now) !== "finished",
  );
  const finishedMatches = upcoming.filter(
    (match) => getDashboardMatchPhase(match, now) === "finished",
  );

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "dashboard.title")}
        </h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label={t(locale, "dashboard.upcoming")} value={upcoming.length} />
        <Metric label={t(locale, "dashboard.missing")} value={missingPicks} />
        <Metric label={t(locale, "dashboard.picksMade")} value={picksMade} />
      </div>

      <div className="grid gap-4">
        {upcoming.length > 0 ? (
          <>
            {activeMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                appearance={getDashboardMatchPhase(match, now)}
                lockMinutes={lockMinutes}
                comments={commentsByMatch.get(match.id) ?? []}
                friendPredictions={friendPredictionsByMatch.get(match.id) ?? []}
                mentionableUsers={mentionableUsers}
                currentUserId={profile.id}
                locale={locale}
              />
            ))}
            {finishedMatches.length > 0 && activeMatches.length > 0 && (
              <DashboardSectionHeader
                label={t(locale, "dashboard.finished")}
              />
            )}
            {finishedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                appearance="finished"
                lockMinutes={lockMinutes}
                comments={commentsByMatch.get(match.id) ?? []}
                friendPredictions={friendPredictionsByMatch.get(match.id) ?? []}
                mentionableUsers={mentionableUsers}
                currentUserId={profile.id}
                locale={locale}
              />
            ))}
          </>
        ) : (
          <Card>
            <p className="font-semibold text-zinc-950">
              {t(locale, "dashboard.empty.title")}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {t(locale, "dashboard.empty.body")}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-black text-zinc-950">{value}</div>
      <div className="mt-1 text-sm font-medium text-zinc-500">{label}</div>
    </Card>
  );
}

function DashboardSectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="h-0.5 flex-1 rounded-full bg-zinc-300" />
      <h2 className="rounded-full border border-zinc-300 bg-zinc-200/80 px-5 py-2 text-sm font-black uppercase tracking-[0.15em] text-zinc-700 shadow-sm">
        {label}
      </h2>
      <div className="h-0.5 flex-1 rounded-full bg-zinc-300" />
    </div>
  );
}
