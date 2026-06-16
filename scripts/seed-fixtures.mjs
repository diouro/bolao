import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding fixtures.",
  );
}

const fixturePath = resolve(process.cwd(), "data/world-cup-2026.json");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rows = fixture.matches.map((match) => ({
  id: match.id,
  tournament_id: match.tournamentId ?? fixture.tournament.id,
  round: match.round,
  group_code: match.group ?? null,
  home_team_code: typeof match.home === "string" ? match.home : null,
  away_team_code: typeof match.away === "string" ? match.away : null,
  home_slot: typeof match.home === "string" ? null : match.home.slot,
  away_slot: typeof match.away === "string" ? null : match.away.slot,
  kickoff_at: match.kickoff,
  venue: match.venue ?? null,
}));

const { error } = await supabase.from("matches").upsert(rows, {
  onConflict: "id",
});

if (error) {
  throw new Error(error.message);
}

console.log(`Seeded ${rows.length} World Cup matches.`);
