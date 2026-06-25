import { getCronSecret } from "@/lib/env";
import { runMatchResultsSync } from "@/lib/results/run-match-results-sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    return Response.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await runMatchResultsSync();

    return Response.json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync match results.";

    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
