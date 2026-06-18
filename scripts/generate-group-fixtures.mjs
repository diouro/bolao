/**
 * Official 2026 World Cup group-stage fixtures (matches 1–72).
 * Times converted from US Eastern (EDT, UTC-4) to UTC.
 */
const official = [
  ["A", "MEX", "RSA", "2026-06-11", "15:00"],
  ["A", "KOR", "CZE", "2026-06-11", "22:00"],
  ["B", "CAN", "BIH", "2026-06-12", "15:00"],
  ["D", "USA", "PAR", "2026-06-12", "21:00"],
  ["C", "HAI", "SCO", "2026-06-13", "21:00"],
  ["D", "AUS", "TUR", "2026-06-13", "24:00"],
  ["C", "BRA", "MAR", "2026-06-13", "18:00"],
  ["B", "QAT", "SUI", "2026-06-13", "15:00"],
  ["E", "CIV", "ECU", "2026-06-14", "19:00"],
  ["E", "GER", "CUW", "2026-06-14", "13:00"],
  ["F", "NED", "JPN", "2026-06-14", "16:00"],
  ["F", "SWE", "TUN", "2026-06-14", "22:00"],
  ["H", "KSA", "URU", "2026-06-15", "18:00"],
  ["H", "ESP", "CPV", "2026-06-15", "12:00"],
  ["G", "IRN", "NZL", "2026-06-15", "21:00"],
  ["G", "BEL", "EGY", "2026-06-15", "15:00"],
  ["I", "FRA", "SEN", "2026-06-16", "15:00"],
  ["I", "IRQ", "NOR", "2026-06-16", "18:00"],
  ["J", "ARG", "ALG", "2026-06-16", "21:00"],
  ["J", "AUT", "JOR", "2026-06-16", "24:00"],
  ["L", "GHA", "PAN", "2026-06-17", "19:00"],
  ["L", "ENG", "CRO", "2026-06-17", "16:00"],
  ["K", "POR", "COD", "2026-06-17", "13:00"],
  ["K", "UZB", "COL", "2026-06-17", "22:00"],
  ["A", "CZE", "RSA", "2026-06-18", "12:00"],
  ["B", "SUI", "BIH", "2026-06-18", "15:00"],
  ["B", "CAN", "QAT", "2026-06-18", "18:00"],
  ["A", "MEX", "KOR", "2026-06-18", "21:00"],
  ["C", "BRA", "HAI", "2026-06-19", "21:00"],
  ["C", "SCO", "MAR", "2026-06-19", "18:00"],
  ["D", "TUR", "PAR", "2026-06-19", "23:00"],
  ["D", "USA", "AUS", "2026-06-19", "15:00"],
  ["E", "GER", "CIV", "2026-06-20", "16:00"],
  ["E", "ECU", "CUW", "2026-06-20", "20:00"],
  ["F", "NED", "SWE", "2026-06-20", "13:00"],
  ["F", "TUN", "JPN", "2026-06-20", "24:00"],
  ["H", "URU", "CPV", "2026-06-21", "18:00"],
  ["H", "ESP", "KSA", "2026-06-21", "12:00"],
  ["G", "BEL", "IRN", "2026-06-21", "15:00"],
  ["G", "NZL", "EGY", "2026-06-21", "21:00"],
  ["I", "NOR", "SEN", "2026-06-22", "20:00"],
  ["I", "FRA", "IRQ", "2026-06-22", "17:00"],
  ["J", "ARG", "AUT", "2026-06-22", "13:00"],
  ["J", "JOR", "ALG", "2026-06-22", "23:00"],
  ["L", "ENG", "GHA", "2026-06-23", "16:00"],
  ["L", "PAN", "CRO", "2026-06-23", "19:00"],
  ["K", "POR", "UZB", "2026-06-23", "13:00"],
  ["K", "COL", "COD", "2026-06-23", "22:00"],
  ["C", "SCO", "BRA", "2026-06-24", "18:00"],
  ["C", "MAR", "HAI", "2026-06-24", "18:00"],
  ["B", "SUI", "CAN", "2026-06-24", "15:00"],
  ["B", "BIH", "QAT", "2026-06-24", "15:00"],
  ["A", "CZE", "MEX", "2026-06-24", "21:00"],
  ["A", "RSA", "KOR", "2026-06-24", "21:00"],
  ["E", "CUW", "CIV", "2026-06-25", "16:00"],
  ["E", "ECU", "GER", "2026-06-25", "16:00"],
  ["F", "JPN", "SWE", "2026-06-25", "19:00"],
  ["F", "TUN", "NED", "2026-06-25", "19:00"],
  ["D", "TUR", "USA", "2026-06-25", "22:00"],
  ["D", "PAR", "AUS", "2026-06-25", "22:00"],
  ["I", "NOR", "FRA", "2026-06-26", "15:00"],
  ["I", "SEN", "IRQ", "2026-06-26", "15:00"],
  ["G", "EGY", "IRN", "2026-06-26", "23:00"],
  ["G", "NZL", "BEL", "2026-06-26", "23:00"],
  ["H", "CPV", "KSA", "2026-06-26", "20:00"],
  ["H", "URU", "ESP", "2026-06-26", "20:00"],
  ["L", "PAN", "ENG", "2026-06-27", "17:00"],
  ["L", "CRO", "GHA", "2026-06-27", "17:00"],
  ["J", "ALG", "AUT", "2026-06-27", "22:00"],
  ["J", "JOR", "ARG", "2026-06-27", "22:00"],
  ["K", "COL", "POR", "2026-06-27", "19:30"],
  ["K", "COD", "UZB", "2026-06-27", "19:30"],
];

function etToUtcIso(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const etHour = hour === 24 ? 0 : hour;
  const etDayOffset = hour === 24 ? 1 : 0;
  const utc = new Date(Date.UTC(year, month - 1, day + etDayOffset, etHour + 4, minute));
  return utc.toISOString().replace(".000Z", "Z");
}

const byGroup = new Map();

for (const [group, home, away, date, time] of official) {
  if (!byGroup.has(group)) {
    byGroup.set(group, []);
  }
  byGroup.get(group).push({
    round: "group",
    group,
    home,
    away,
    kickoff: etToUtcIso(date, time),
  });
}

const matches = [];

for (const [group, fixtures] of [...byGroup.entries()].sort()) {
  fixtures.forEach((fixture, index) => {
    matches.push({
      id: `wc2026-${group.toLowerCase()}-${index + 1}`,
      ...fixture,
    });
  });
}

console.log(JSON.stringify(matches, null, 2));
