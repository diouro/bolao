import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { resolve } from "path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before applying fixture corrections.",
  );
}

const fixturePath = resolve(process.cwd(), "data/world-cup-2026.json");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const teamNames = new Map(fixture.teams.map((team) => [team.code, team.name]));

const rows = fixture.matches
  .filter((match) => match.round === "group")
  .map((match) => ({
    id: match.id,
    tournament_id: fixture.tournament.id,
    round: match.round,
    group_code: match.group,
    home_team_code: match.home,
    away_team_code: match.away,
    home_team_name: teamNames.get(match.home) ?? null,
    away_team_name: teamNames.get(match.away) ?? null,
    home_slot: null,
    away_slot: null,
    kickoff_at: match.kickoff,
  }));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await supabase.from("matches").upsert(rows, { onConflict: "id" });

if (error) {
  throw new Error(error.message);
}

console.log(`Applied ${rows.length} group-stage fixture corrections.`);
