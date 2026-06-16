import {
  getFootballDataApiToken,
  getFootballDataSeason,
} from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";
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
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
};

export class FootballDataResultsProvider implements ResultsProvider {
  async getMatchResult(matchId: string): Promise<MatchResult | null> {
    const supabase = await createSupabaseServerClient();
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
    const result = extractFinalScore(remoteMatch);

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
    const remoteMatches = await this.fetchFinishedMatches();
    const supabase = await createSupabaseServerClient();
    const { data: localMatches, error } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    let updated = 0;
    let skipped = 0;

    for (const remoteMatch of remoteMatches) {
      const result = extractFinalScore(remoteMatch);

      if (!result) {
        skipped += 1;
        continue;
      }

      const localMatch = findLocalMatch(remoteMatch, (localMatches ?? []) as Match[]);

      if (!localMatch) {
        skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          home_score: result.homeScore,
          away_score: result.awayScore,
          status: "finished",
          external_provider: providerName,
          external_match_id: String(remoteMatch.id),
          external_home_team_id: stringifyId(remoteMatch.homeTeam.id),
          external_away_team_id: stringifyId(remoteMatch.awayTeam.id),
          home_team_code: normalizeCode(remoteMatch.homeTeam.tla),
          away_team_code: normalizeCode(remoteMatch.awayTeam.tla),
          home_team_name: remoteMatch.homeTeam.name ?? null,
          away_team_name: remoteMatch.awayTeam.name ?? null,
        })
        .eq("id", localMatch.id);

      if (updateError) {
        throw new Error(updateError.message);
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

  private async fetchFinishedMatches() {
    const params = new URLSearchParams({
      season: getFootballDataSeason(),
      status: "FINISHED",
    });

    const data = await this.fetchFootballData<{ matches: FootballDataMatch[] }>(
      `/competitions/WC/matches?${params.toString()}`,
    );

    return data.matches ?? [];
  }

  private async fetchMatch(externalMatchId: string) {
    return this.fetchFootballData<FootballDataMatch>(`/matches/${externalMatchId}`);
  }

  private async fetchFootballData<T>(path: string) {
    const token = getFootballDataApiToken();

    if (!token) {
      throw new Error(
        "FOOTBALL_DATA_API_TOKEN is not configured. Add it to .env.local or .env.production.",
      );
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "X-Auth-Token": token,
      },
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`football-data.org request failed: ${response.status} ${message}`);
    }

    return (await response.json()) as T;
  }
}

function extractFinalScore(match: FootballDataMatch) {
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  if (match.status !== "FINISHED" || homeScore === null || awayScore === null) {
    return null;
  }

  return {
    homeScore,
    awayScore,
  };
}

function findLocalMatch(remoteMatch: FootballDataMatch, localMatches: Match[]) {
  const externalId = String(remoteMatch.id);
  const byExternalId = localMatches.find(
    (match) =>
      match.external_provider === providerName &&
      match.external_match_id === externalId,
  );

  if (byExternalId) {
    return byExternalId;
  }

  const homeCode = normalizeCode(remoteMatch.homeTeam.tla);
  const awayCode = normalizeCode(remoteMatch.awayTeam.tla);

  const byExternalTeamIds = localMatches.find(
    (match) =>
      match.external_home_team_id === stringifyId(remoteMatch.homeTeam.id) &&
      match.external_away_team_id === stringifyId(remoteMatch.awayTeam.id) &&
      nearKickoff(match.kickoff_at, remoteMatch.utcDate),
  );

  if (byExternalTeamIds) {
    return byExternalTeamIds;
  }

  if (!homeCode || !awayCode) {
    return null;
  }

  const candidates = localMatches.filter(
    (match) =>
      match.home_team_code === homeCode &&
      match.away_team_code === awayCode,
  );

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const remoteKickoff = new Date(remoteMatch.utcDate).getTime();

  return candidates
    .map((match) => ({
      match,
      distance: Math.abs(new Date(match.kickoff_at).getTime() - remoteKickoff),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.match ?? null;
}

function nearKickoff(localKickoff: string, remoteKickoff: string) {
  const oneDayMs = 24 * 60 * 60 * 1000;

  return (
    Math.abs(new Date(localKickoff).getTime() - new Date(remoteKickoff).getTime()) <
    oneDayMs
  );
}

function normalizeCode(code?: string | null) {
  return code?.trim().toUpperCase() || null;
}

function stringifyId(id?: number | null) {
  return id === null || id === undefined ? null : String(id);
}
