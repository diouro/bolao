import { createResultsProvider } from "@/lib/results";
import { ensureFootballDataSyncConfigured } from "@/lib/results/config";
import { revalidateAfterMatchResultsSync } from "@/lib/results/revalidate-after-sync";
import type { SyncResultsSummary } from "@/lib/results/provider";

export async function runMatchResultsSync(options?: {
  revalidate?: boolean;
}): Promise<SyncResultsSummary> {
  ensureFootballDataSyncConfigured();
  const provider = createResultsProvider();

  if (!provider.syncFinishedMatches) {
    throw new Error("The configured results provider does not support syncing.");
  }

  const summary = await provider.syncFinishedMatches();

  if (options?.revalidate !== false && summary.updated > 0) {
    revalidateAfterMatchResultsSync();
  }

  return summary;
}
