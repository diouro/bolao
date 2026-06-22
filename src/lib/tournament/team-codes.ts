const teamCodeAliases: Record<string, string> = {
  URY: "URU",
};

export function normalizeTeamCode(code?: string | null) {
  if (!code) {
    return null;
  }

  const normalized = code.trim().toUpperCase();

  return teamCodeAliases[normalized] ?? normalized;
}
