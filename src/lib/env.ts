function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function getSupabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublicKey() {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getPlatformBaseUrl() {
  return readEnv("PLATFORM_BASE_URL") || "http://localhost:3000";
}

export function getPlatformName() {
  return readEnv("PLATFORM_NAME") || "Bolão";
}

export function getAppTimeZone() {
  return readEnv("APP_TIME_ZONE") || "Australia/Sydney";
}

export function getBootstrapAdminEmail() {
  return readEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
}

export function getResultsProvider() {
  return readEnv("RESULTS_PROVIDER") || "manual";
}

export function getFootballDataApiToken() {
  return readEnv("FOOTBALL_DATA_API_TOKEN");
}

export function getFootballDataSeason() {
  return readEnv("FOOTBALL_DATA_SEASON") || "2026";
}

export function getCronSecret() {
  return readEnv("CRON_SECRET");
}
