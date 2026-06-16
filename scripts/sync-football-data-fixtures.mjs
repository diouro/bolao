import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const providerName = "football-data";
const apiBaseUrl = "https://api.football-data.org/v4";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiToken = process.env.FOOTBALL_DATA_API_TOKEN;
const season = process.env.FOOTBALL_DATA_SEASON || "2026";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before syncing fixtures.",
  );
}

if (!apiToken) {
  throw new Error("Set FOOTBALL_DATA_API_TOKEN before syncing fixtures.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const remoteMatches = await fetchFootballDataMatches();
const { data: localMatches, error: localError } = await supabase
  .from("matches")
  .select("*");

if (localError) {
  throw new Error(localError.message);
}

const rows = remoteMatches.map((remoteMatch) => {
  const existing = findExistingMatch(remoteMatch, localMatches ?? []);
  const score = extractScore(remoteMatch);
  const status = mapStatus(remoteMatch.status);

  return {
    id: existing?.id ?? `fd-${remoteMatch.id}`,
    tournament_id: "wc2026",
    round: mapRound(remoteMatch.stage),
    group_code: mapGroup(remoteMatch.group),
    home_team_code: normalizeCode(remoteMatch.homeTeam?.tla),
    away_team_code: normalizeCode(remoteMatch.awayTeam?.tla),
    home_team_name: remoteMatch.homeTeam?.name ?? null,
    away_team_name: remoteMatch.awayTeam?.name ?? null,
    home_slot: remoteMatch.homeTeam?.name ? null : "TBD",
    away_slot: remoteMatch.awayTeam?.name ? null : "TBD",
    kickoff_at: remoteMatch.utcDate,
    venue: remoteMatch.venue ?? null,
    status,
    home_score: score?.homeScore ?? existing?.home_score ?? null,
    away_score: score?.awayScore ?? existing?.away_score ?? null,
    external_provider: providerName,
    external_match_id: String(remoteMatch.id),
    external_home_team_id: stringifyId(remoteMatch.homeTeam?.id),
    external_away_team_id: stringifyId(remoteMatch.awayTeam?.id),
  };
});

const { error } = await supabase.from("matches").upsert(rows, {
  onConflict: "id",
});

if (error) {
  throw new Error(error.message);
}

const duplicatePlaceholderSummary = await removeDuplicateApiPlaceholderFixtures();
const dedupeSummary = await mergeDuplicateApiFixtures();

console.log(
  `Synced ${rows.length} World Cup fixtures from football-data.org. Removed ${dedupeSummary.removed} duplicate JSON fixture${dedupeSummary.removed === 1 ? "" : "s"} and ${duplicatePlaceholderSummary.removed} generic API knockout placeholder${duplicatePlaceholderSummary.removed === 1 ? "" : "s"}.`,
);

async function fetchFootballDataMatches() {
  const params = new URLSearchParams({ season });
  const response = await fetch(
    `${apiBaseUrl}/competitions/WC/matches?${params.toString()}`,
    {
      headers: {
        "X-Auth-Token": apiToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `football-data.org request failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = await response.json();
  return data.matches ?? [];
}

function findExistingMatch(remoteMatch, localMatches) {
  const externalId = String(remoteMatch.id);
  const byExternalId = localMatches.find(
    (match) =>
      match.external_provider === providerName &&
      match.external_match_id === externalId,
  );

  if (byExternalId) {
    return byExternalId;
  }

  const homeCode = normalizeCode(remoteMatch.homeTeam?.tla);
  const awayCode = normalizeCode(remoteMatch.awayTeam?.tla);

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

function extractScore(remoteMatch) {
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

    if (liveScore) {
      return {
        homeScore: liveScore.home,
        awayScore: liveScore.away,
      };
    }
  }

  return null;
}

function mapStatus(status) {
  if (status === "FINISHED") {
    return "finished";
  }

  if (["IN_PLAY", "PAUSED"].includes(status)) {
    return "live";
  }

  return "scheduled";
}

function mapRound(stage) {
  const normalized = String(stage ?? "").toUpperCase();

  if (normalized === "GROUP_STAGE") return "group";
  if (normalized === "LAST_32") return "round_of_32";
  if (normalized === "LAST_16") return "round_of_16";
  if (normalized === "QUARTER_FINALS") return "quarter_final";
  if (normalized === "SEMI_FINALS") return "semi_final";
  if (normalized === "THIRD_PLACE") return "third_place";
  if (normalized === "FINAL") return "final";

  return "group";
}

function mapGroup(group) {
  const normalized = String(group ?? "").toUpperCase();
  const match = normalized.match(/GROUP[_\s-]?([A-L])/);

  return match?.[1] ?? null;
}

function normalizeCode(code) {
  return code?.trim().toUpperCase() || null;
}

function stringifyId(id) {
  return id === null || id === undefined ? null : String(id);
}

async function mergeDuplicateApiFixtures() {
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const apiMatchesByFixtureKey = new Map();

  for (const match of matches ?? []) {
    if (match.external_provider !== providerName || !match.external_match_id) {
      continue;
    }

    const key = fixtureKey(match);

    if (key) {
      apiMatchesByFixtureKey.set(key, match);
    }
  }

  let removed = 0;

  for (const staleMatch of matches ?? []) {
    if (staleMatch.external_provider || staleMatch.external_match_id) {
      continue;
    }

    const replacement = apiMatchesByFixtureKey.get(fixtureKey(staleMatch));

    if (!replacement || replacement.id === staleMatch.id) {
      continue;
    }

    await movePredictions(staleMatch.id, replacement.id);
    await moveComments(staleMatch.id, replacement.id);

    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", staleMatch.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    removed += 1;
  }

  return { removed };
}

async function removeDuplicateApiPlaceholderFixtures() {
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .neq("round", "group")
    .order("kickoff_at", { ascending: true });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const jsonPlaceholderCounts = new Map();

  for (const match of matches ?? []) {
    if (match.external_provider || !hasSpecificSlot(match)) {
      continue;
    }

    jsonPlaceholderCounts.set(
      match.round,
      (jsonPlaceholderCounts.get(match.round) ?? 0) + 1,
    );
  }

  let removed = 0;

  for (const match of matches ?? []) {
    if (
      match.external_provider !== providerName ||
      match.home_team_code ||
      match.away_team_code ||
      match.home_team_name ||
      match.away_team_name ||
      match.home_slot !== "TBD" ||
      match.away_slot !== "TBD" ||
      !jsonPlaceholderCounts.has(match.round)
    ) {
      continue;
    }

    await movePredictions(match.id, findNearestJsonPlaceholder(matches ?? [], match)?.id);
    await moveComments(match.id, findNearestJsonPlaceholder(matches ?? [], match)?.id);

    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", match.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    removed += 1;
  }

  return { removed };
}

function hasSpecificSlot(match) {
  return (
    (match.home_slot && match.home_slot !== "TBD") ||
    (match.away_slot && match.away_slot !== "TBD")
  );
}

function findNearestJsonPlaceholder(matches, apiPlaceholder) {
  return matches
    .filter(
      (match) =>
        !match.external_provider &&
        match.round === apiPlaceholder.round &&
        hasSpecificSlot(match),
    )
    .map((match) => ({
      match,
      distance: Math.abs(
        new Date(match.kickoff_at).getTime() -
          new Date(apiPlaceholder.kickoff_at).getTime(),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.match ?? null;
}

function fixtureKey(match) {
  if (!match.home_team_code || !match.away_team_code) {
    return null;
  }

  return [
    match.tournament_id,
    match.round,
    match.group_code ?? "",
    match.home_team_code,
    match.away_team_code,
  ].join(":");
}

async function movePredictions(fromMatchId, toMatchId) {
  if (!toMatchId) {
    return;
  }

  const [
    { data: stalePredictions, error: staleError },
    { data: existingPredictions, error: existingError },
  ] = await Promise.all([
    supabase.from("predictions").select("*").eq("match_id", fromMatchId),
    supabase.from("predictions").select("user_id").eq("match_id", toMatchId),
  ]);

  if (staleError) {
    throw new Error(staleError.message);
  }

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingUserIds = new Set(
    (existingPredictions ?? []).map((prediction) => prediction.user_id),
  );
  const predictionsToMove = (stalePredictions ?? [])
    .filter((prediction) => !existingUserIds.has(prediction.user_id))
    .map((prediction) => ({
      ...prediction,
      match_id: toMatchId,
    }));

  if (predictionsToMove.length > 0) {
    const { error: upsertError } = await supabase
      .from("predictions")
      .upsert(predictionsToMove, {
        onConflict: "user_id,match_id",
        ignoreDuplicates: true,
      });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from("predictions")
    .delete()
    .eq("match_id", fromMatchId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function moveComments(fromMatchId, toMatchId) {
  if (!toMatchId) {
    return;
  }

  const { error } = await supabase
    .from("match_comments")
    .update({ match_id: toMatchId })
    .eq("match_id", fromMatchId);

  if (error) {
    throw new Error(error.message);
  }
}
