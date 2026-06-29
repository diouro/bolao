import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
import { computeGroupStandings, getQualifiedThirdPlaceTeams } from "../src/lib/tournament/group-standings.ts";
import { enrichMatchesWithBracketTeams } from "../src/lib/tournament/resolve-bracket.ts";
import { getTeams } from "../src/lib/tournament/load-fixtures.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: matches } = await supabase.from("matches").select("*").order("kickoff_at");
const teams = getTeams();
const standings = computeGroupStandings(matches ?? [], teams);
const thirds = getQualifiedThirdPlaceTeams(standings);
const enriched = enrichMatchesWithBracketTeams(matches ?? [], teams);
const r32 = enriched
  .filter((m) => m.round === "round_of_32")
  .sort((a, b) => a.id.localeCompare(b.id));

console.log("=== QUALIFIED 3RDS (our ranking) ===");
thirds.forEach((t, i) =>
  console.log(
    i + 1,
    t.groupCode,
    t.teamCode,
    t.points,
    "GD",
    t.goalDifference,
    "GF",
    t.goalsFor,
  ),
);

console.log("\n=== R32 (our resolution) ===");
for (const m of r32) {
  const slotMatch = m.id.match(/r32-(\d+)/);
  const num = slotMatch?.[1] ?? "?";
  console.log(
    `M${73 + Number(num) - 1}`.replace(/M(\d+)/, (_, n) => `M${n}`),
    m.home_slot?.padEnd(8),
    "vs",
    m.away_slot?.padEnd(8),
    "=>",
    (m.home_team_code ?? "?").padEnd(4),
    "vs",
    m.away_team_code ?? "?",
  );
}

// Official pairings from Wikipedia (combination row 1: B,D,E,F,I,J,K,L thirds)
const officialThirdGroups = ["B", "D", "E", "F", "I", "J", "K", "L"];
const officialPairings = {
  "1A": "3E",
  "1B": "3J",
  "1D": "3B",
  "1E": "3D",
  "1G": "3I",
  "1I": "3F",
  "1K": "3L",
  "1L": "3K",
};

console.log("\n=== 3RD PLACE GROUP COMPARISON ===");
const ourThirdGroups = thirds.map((t) => t.groupCode).sort().join("");
const officialSorted = [...officialThirdGroups].sort().join("");
console.log("Our qualifying 3rd groups:", thirds.map((t) => t.groupCode).join(", "));
console.log("Official (Wikipedia):", officialThirdGroups.join(", "));
console.log("Match:", ourThirdGroups === officialSorted ? "YES" : "NO");

console.log("\n=== 3RD PLACE SLOT ASSIGNMENTS (1X vs 3Y) ===");
for (const m of r32.filter((x) => x.home_slot?.startsWith("1") && x.away_slot?.startsWith("3"))) {
  const winner = m.home_slot;
  const expected = officialPairings[winner];
  const actualThirdGroup = thirds.find((t) => t.teamCode === m.away_team_code)?.groupCode;
  const ok = expected === `3${actualThirdGroup}`;
  console.log(
    `${winner} vs ${m.away_slot} => ${m.home_team_code} vs ${m.away_team_code} (3rd from ${actualThirdGroup})`,
    expected ? `[official: ${expected}] ${ok ? "OK" : "WRONG"}` : "",
  );
}
