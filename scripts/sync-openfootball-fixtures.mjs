/**
 * Sync kickoff times (and knockout slots) from openfootball/worldcup.json.
 * Source: https://github.com/openfootball/worldcup.json/tree/master/2026
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

/** Maps FIFA match number -> our bracket match id (follows r16/qf/sf tree wiring). */
const fifaMatchToLocalId = {
  73: "wc2026-r32-1",
  75: "wc2026-r32-2",
  76: "wc2026-r32-3",
  78: "wc2026-r32-4",
  79: "wc2026-r32-5",
  80: "wc2026-r32-6",
  81: "wc2026-r32-7",
  82: "wc2026-r32-8",
  83: "wc2026-r32-9",
  84: "wc2026-r32-10",
  86: "wc2026-r32-11",
  88: "wc2026-r32-12",
  85: "wc2026-r32-13",
  87: "wc2026-r32-14",
  74: "wc2026-r32-15",
  77: "wc2026-r32-16",
  90: "wc2026-r16-1",
  91: "wc2026-r16-2",
  92: "wc2026-r16-3",
  94: "wc2026-r16-4",
  93: "wc2026-r16-5",
  95: "wc2026-r16-6",
  96: "wc2026-r16-7",
  89: "wc2026-r16-8",
  99: "wc2026-qf-1",
  100: "wc2026-qf-2",
  98: "wc2026-qf-3",
  97: "wc2026-qf-4",
  102: "wc2026-sf-1",
  101: "wc2026-sf-2",
  103: "wc2026-third",
  104: "wc2026-final",
};

/** Official R32 slot pairings by FIFA match number — always use slots, not team codes. */
const fifaR32Slots = {
  73: { home: "2A", away: "2B" },
  74: { home: "1E", away: "3ABCDF" },
  75: { home: "1F", away: "2C" },
  76: { home: "1C", away: "2F" },
  77: { home: "1I", away: "3CDFGH" },
  78: { home: "2E", away: "2I" },
  79: { home: "1A", away: "3CEFHI" },
  80: { home: "1L", away: "3EHIJK" },
  81: { home: "1D", away: "3BEFIJ" },
  82: { home: "1G", away: "3AEHIJ" },
  83: { home: "2K", away: "2L" },
  84: { home: "1H", away: "2J" },
  85: { home: "1B", away: "3EFGIJ" },
  86: { home: "1J", away: "2H" },
  87: { home: "1K", away: "3DEIJL" },
  88: { home: "2D", away: "2G" },
};

const teamNameToCode = {
  Mexico: "MEX",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Czech Republic": "CZE",
  Canada: "CAN",
  "Bosnia & Herzegovina": "BIH",
  Qatar: "QAT",
  Switzerland: "SUI",
  Brazil: "BRA",
  Morocco: "MAR",
  Haiti: "HAI",
  Scotland: "SCO",
  "United States": "USA",
  USA: "USA",
  Paraguay: "PAR",
  Australia: "AUS",
  Turkey: "TUR",
  Germany: "GER",
  "Curaçao": "CUW",
  Curacao: "CUW",
  "Ivory Coast": "CIV",
  Ecuador: "ECU",
  Netherlands: "NED",
  Japan: "JPN",
  Sweden: "SWE",
  Tunisia: "TUN",
  Belgium: "BEL",
  Egypt: "EGY",
  Iran: "IRN",
  "New Zealand": "NZL",
  Spain: "ESP",
  "Cape Verde": "CPV",
  "Saudi Arabia": "KSA",
  Uruguay: "URU",
  France: "FRA",
  Senegal: "SEN",
  Iraq: "IRQ",
  Norway: "NOR",
  Argentina: "ARG",
  Algeria: "ALG",
  Austria: "AUT",
  Jordan: "JOR",
  Portugal: "POR",
  "DR Congo": "COD",
  Uzbekistan: "UZB",
  Colombia: "COL",
  England: "ENG",
  Croatia: "CRO",
  Ghana: "GHA",
  Panama: "PAN",
};

const response = await fetch(OPENFOOTBALL_URL);

if (!response.ok) {
  throw new Error(`Failed to fetch openfootball fixtures: ${response.status}`);
}

const openFootball = await response.json();
const fixturePath = resolve(process.cwd(), "data/world-cup-2026.json");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const localById = new Map(fixture.matches.map((match) => [match.id, match]));

let groupUpdates = 0;
let knockoutUpdates = 0;

for (const remote of openFootball.matches) {
  const kickoff = toUtcIso(remote.date, remote.time);

  if (remote.group) {
    const groupCode = remote.group.replace("Group ", "");
    const home = teamNameToCode[remote.team1];
    const away = teamNameToCode[remote.team2];

    if (!home || !away) {
      console.warn(`Skipping group match with unknown team: ${remote.team1} vs ${remote.team2}`);
      continue;
    }

    const local = fixture.matches.find(
      (match) =>
        match.round === "group" &&
        match.group === groupCode &&
        match.home === home &&
        match.away === away,
    );

    if (!local) {
      console.warn(`No local group match for ${groupCode} ${home} vs ${away}`);
      continue;
    }

    if (local.kickoff !== kickoff) {
      local.kickoff = kickoff;
      groupUpdates += 1;
    }

    continue;
  }

  if (!remote.num) {
    continue;
  }

  const localId = fifaMatchToLocalId[remote.num];

  if (!localId) {
    console.warn(`No local id mapping for FIFA match ${remote.num}`);
    continue;
  }

  const local = localById.get(localId);

  if (!local) {
    console.warn(`Local match ${localId} not found for FIFA match ${remote.num}`);
    continue;
  }

  if (local.kickoff !== kickoff) {
    local.kickoff = kickoff;
    knockoutUpdates += 1;
  }

  if (remote.num >= 73 && remote.num <= 88) {
    const slots = fifaR32Slots[remote.num];

    if (slots) {
      local.home = { slot: slots.home };
      local.away = { slot: slots.away };
    }
  }
}

await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);

console.log(
  `Updated ${groupUpdates} group and ${knockoutUpdates} knockout kickoffs in ${fixturePath}.`,
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && serviceRoleKey) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const match of fixture.matches) {
    const isKnockout = match.round !== "group";
    const row = {
      kickoff_at: match.kickoff,
      ...(isKnockout
        ? {
            home_team_code: typeof match.home === "string" ? match.home : null,
            away_team_code: typeof match.away === "string" ? match.away : null,
            home_slot: typeof match.home === "string" ? null : match.home?.slot ?? null,
            away_slot: typeof match.away === "string" ? null : match.away?.slot ?? null,
          }
        : {}),
    };

    const { error } = await supabase.from("matches").update(row).eq("id", match.id);

    if (error) {
      throw new Error(`${match.id}: ${error.message}`);
    }
  }

  console.log(`Pushed ${fixture.matches.length} kickoff updates to Supabase.`);
}

function toUtcIso(date, time) {
  const match = time.match(/^(\d{1,2}):(\d{2}) UTC([+-]?\d+)$/);

  if (!match) {
    throw new Error(`Unsupported time format: ${time}`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const offsetHours = Number(match[3]);
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));

  return utc.toISOString().replace(".000Z", "Z");
}
