import {
  getFootballDataApiToken,
  getResultsProvider,
  getSupabaseServiceRoleKey,
} from "@/lib/env";

export function ensureFootballDataSyncConfigured() {
  if (getResultsProvider() !== "football-data") {
    throw new Error(
      "RESULTS_PROVIDER must be set to football-data on the server (for example in Vercel project settings).",
    );
  }

  if (!getFootballDataApiToken()) {
    throw new Error(
      "FOOTBALL_DATA_API_TOKEN is not configured on the server.",
    );
  }

  if (!getSupabaseServiceRoleKey()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for syncing finished scores.",
    );
  }
}
