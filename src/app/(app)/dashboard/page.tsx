import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { Card } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getMatchCommentsForMatches } from "@/lib/comments";
import { getAppDateKey } from "@/lib/dates";
import {
  getFriendPredictionsForMatches,
  getMatchesWithUserPredictions,
} from "@/lib/matches";
import { isPredictionLocked } from "@/lib/predictions/lock";
import { getPredictionLockMinutes } from "@/lib/predictions/settings";
import { getMentionableUsers } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const matches = await getMatchesWithUserPredictions(profile.id);
  const lockMinutes = await getPredictionLockMinutes();
  const now = new Date();
  const openMatches = matches.filter(
    (match) =>
      match.status === "scheduled" &&
      !isPredictionLocked({
        kickoffAt: match.kickoff_at,
        lockMinutes,
        now,
      })
  );
  const upcoming = getNextMatchDayMatches(openMatches);
  const commentsByMatch = await getMatchCommentsForMatches(
    upcoming.map((match) => match.id)
  );
  const mentionableUsers = await getMentionableUsers();
  const friendPredictionsByMatch = await getFriendPredictionsForMatches(
    upcoming.map((match) => match.id)
  );
  const missingPicks = upcoming.filter((match) => !match.prediction).length;
  const picksMade = upcoming.filter((match) => match.prediction).length;

  return (
    <AppShell profile={profile} active="dashboard">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Your next predictions
        </h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Upcoming matches" value={upcoming.length} />
        <Metric label="Missing picks" value={missingPicks} />
        <Metric label="Picks made" value={picksMade} />
      </div>

      <div className="grid gap-4">
        {upcoming.length > 0 ? (
          upcoming.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              lockMinutes={lockMinutes}
              comments={commentsByMatch.get(match.id) ?? []}
              friendPredictions={friendPredictionsByMatch.get(match.id) ?? []}
              mentionableUsers={mentionableUsers}
              currentUserId={profile.id}
            />
          ))
        ) : (
          <Card>
            <p className="font-semibold text-zinc-950">No upcoming matches.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Once fixtures are seeded, upcoming matches will appear here.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
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

function getNextMatchDayMatches(
  matches: Awaited<ReturnType<typeof getMatchesWithUserPredictions>>
) {
  const firstMatch = matches[0];

  if (!firstMatch) {
    return [];
  }

  const matchDay = getAppDateKey(firstMatch.kickoff_at);

  return matches.filter(
    (match) => getAppDateKey(match.kickoff_at) === matchDay
  );
}
