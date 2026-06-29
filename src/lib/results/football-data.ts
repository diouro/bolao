import { getFootballDataApiToken, getFootballDataSeason } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enrichMatchesWithBracketTeams } from "@/lib/tournament/resolve-bracket";
import { getTeams } from "@/lib/tournament/load-fixtures";
import { normalizeTeamCode } from "@/lib/tournament/team-codes";
import type { Match, MatchStatus, TournamentRound } from "@/lib/types";
import type {
  MatchResult,
  ResultsProvider,
  SyncResultsSummary,
} from "@/lib/results/provider";

const providerName = "football-data";
const apiBaseUrl = "https://api.football-data.org/v4";

type FootballDataTeam = {
  id?: number | null;
  tla?: string | null;
  name?: string | null;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    fullTime?: {
      home: number | null;
      away: number | null;
    };
    regularTime?: {
      home: number | null;
      away: number | null;
    };
    halfTime?: {
      home: number | null;
      away: number | null;
    };
  };
};

export class FootballDataResultsProvider implements ResultsProvider {
  async getMatchResult(matchId: string): Promise<MatchResult | null> {
    const supabase = createSupabaseAdminClient();
    const { data: match, error } = await supabase
      .from("matches")
      .select("id, external_match_id")
      .eq("id", matchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!match?.external_match_id) {
      return null;
    }

    const remoteMatch = await this.fetchMatch(match.external_match_id);
    const result = extractScore(remoteMatch);

    if (!result) {
      return null;
    }

    return {
      matchId,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
    };
  }

  async syncFinishedMatches(): Promise<SyncResultsSummary> {
    const remoteMatches = await this.fetchCompetitionMatches();
    const supabase = createSupabaseAdminClient();
    const { data: localMatches, error } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const resolvedLocalMatches = enrichMatchesWithBracketTeams(
      (localMatches ?? []) as Match[],
      getTeams()
    );

    let updated = 0;
    let skipped = 0;

    for (const remoteMatch of remoteMatches) {
      const parsed = parseRemoteMatch(remoteMatch);

      if (!parsed) {
        skipped += 1;
        continue;
      }

      const localMatch = findLocalMatch(remoteMatch, resolvedLocalMatches);

      if (!localMatch) {
        skipped += 1;
        continue;
      }

      if (!matchNeedsUpdate(localMatch, parsed)) {
        skipped += 1;
        continue;
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from("matches")
        .update({
          home_score: parsed.homeScore,
          away_score: parsed.awayScore,
          status: parsed.status,
          external_provider: providerName,
          external_match_id: String(remoteMatch.id),
          external_home_team_id: stringifyId(remoteMatch.homeTeam.id),
          external_away_team_id: stringifyId(remoteMatch.awayTeam.id),
          home_team_code: normalizeTeamCode(remoteMatch.homeTeam.tla),
          away_team_code: normalizeTeamCode(remoteMatch.awayTeam.tla),
          home_team_name: remoteMatch.homeTeam.name ?? null,
          away_team_name: remoteMatch.awayTeam.name ?? null,
        })
        .eq("id", localMatch.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedMatch) {
        skipped += 1;
        continue;
      }

      updated += 1;
    }

    return {
      provider: providerName,
      checked: remoteMatches.length,
      updated,
      skipped,
    };
  }

  private async fetchCompetitionMatches() {
    const params = new URLSearchParams({
      season: getFootballDataSeason(),
    });

    const data = await this.fetchFootballData<{ matches: FootballDataMatch[] }>(
      `/competitions/WC/matches?${params.toString()}`
    );

    return data.matches ?? [];
  }

  private async fetchMatch(externalMatchId: string) {
    return this.fetchFootballData<FootballDataMatch>(
      `/matches/${externalMatchId}`
    );
  }

  private async fetchFootballData<T>(path: string) {
    const token = getFootballDataApiToken();

    if (!token) {
      throw new Error(
        "FOOTBALL_DATA_API_TOKEN is not configured. Add it to .env.local or .env.production."
      );
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "X-Auth-Token": token,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `football-data.org request failed: ${response.status} ${message}`
      );
    }

    return (await response.json()) as T;
  }
}

type ParsedRemoteMatch = {
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
};

function parseRemoteMatch(
  remoteMatch: FootballDataMatch
): ParsedRemoteMatch | null {
  const score = extractScore(remoteMatch);

  if (!score) {
    return null;
  }

  const status = mapRemoteStatus(remoteMatch.status);

  if (status === "scheduled") {
    return null;
  }

  return {
    status,
    homeScore: score.homeScore,
    awayScore: score.awayScore,
  };
}

function extractScore(remoteMatch: FootballDataMatch): {
  homeScore: number;
  awayScore: number;
} | null {
  const fullTime = remoteMatch.score?.fullTime;
  const regularTime = remoteMatch.score?.regularTime;
  const halfTime = remoteMatch.score?.halfTime;

  if (remoteMatch.status === "FINISHED") {
    if (fullTime?.home != null && fullTime?.away != null) {
      return {
        homeScore: fullTime.home,
        awayScore: fullTime.away,
      };
    }

    return null;
  }

  if (["IN_PLAY", "PAUSED"].includes(remoteMatch.status)) {
    const liveScore =
      regularTime?.home != null && regularTime?.away != null
        ? regularTime
        : halfTime?.home != null && halfTime?.away != null
        ? halfTime
        : null;

    if (liveScore && liveScore.home != null && liveScore.away != null) {
      return {
        homeScore: liveScore.home,
        awayScore: liveScore.away,
      };
    }
  }

  return null;
}

function mapRemoteStatus(status: string): MatchStatus {
  if (status === "FINISHED") {
    return "finished";
  }

  if (["IN_PLAY", "PAUSED"].includes(status)) {
    return "live";
  }

  return "scheduled";
}

function matchNeedsUpdate(localMatch: Match, parsed: ParsedRemoteMatch) {
  return (
    localMatch.status !== parsed.status ||
    localMatch.home_score !== parsed.homeScore ||
    localMatch.away_score !== parsed.awayScore
  );
}

function findLocalMatch(remoteMatch: FootballDataMatch, localMatches: Match[]) {
  const externalId = String(remoteMatch.id);
  const byExternalId = localMatches.find(
    (match) =>
      match.external_provider === providerName &&
      match.external_match_id === externalId
  );

  if (byExternalId) {
    return byExternalId;
  }

  const homeCode = normalizeTeamCode(remoteMatch.homeTeam.tla);
  const awayCode = normalizeTeamCode(remoteMatch.awayTeam.tla);

  const byExternalTeamIds = localMatches.find(
    (match) =>
      match.external_home_team_id === stringifyId(remoteMatch.homeTeam.id) &&
      match.external_away_team_id === stringifyId(remoteMatch.awayTeam.id) &&
      nearKickoff(match.kickoff_at, remoteMatch.utcDate)
  );

  if (byExternalTeamIds) {
    return byExternalTeamIds;
  }

  if (!homeCode || !awayCode) {
    return null;
  }

  const candidates = localMatches.filter(
    (match) =>
      match.home_team_code === homeCode && match.away_team_code === awayCode
  );

  if (candidates.length === 0) {
    const remoteRound = mapRemoteRound(remoteMatch.stage);
    const kickoffMatches = localMatches.filter(
      (match) =>
        match.round === remoteRound &&
        nearKickoff(match.kickoff_at, remoteMatch.utcDate)
    );

    if (kickoffMatches.length === 1) {
      return kickoffMatches[0]!;
    }

    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const remoteKickoff = new Date(remoteMatch.utcDate).getTime();

  return (
    candidates
      .map((match) => ({
        match,
        distance: Math.abs(
          new Date(match.kickoff_at).getTime() - remoteKickoff
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.match ?? null
  );
}

function mapRemoteRound(stage?: string | null): TournamentRound | null {
  const normalized = String(stage ?? "").toUpperCase();

  if (normalized === "LAST_32") {
    return "round_of_32";
  }

  if (normalized === "LAST_16") {
    return "round_of_16";
  }

  if (normalized === "QUARTER_FINALS") {
    return "quarter_final";
  }

  if (normalized === "SEMI_FINALS") {
    return "semi_final";
  }

  if (normalized === "THIRD_PLACE") {
    return "third_place";
  }

  if (normalized === "FINAL") {
    return "final";
  }

  if (normalized === "GROUP_STAGE") {
    return "group";
  }

  return null;
}

function nearKickoff(localKickoff: string, remoteKickoff: string) {
  const oneDayMs = 24 * 60 * 60 * 1000;

  return (
    Math.abs(
      new Date(localKickoff).getTime() - new Date(remoteKickoff).getTime()
    ) < oneDayMs
  );
}

function stringifyId(id?: number | null) {
  return id === null || id === undefined ? null : String(id);
}
