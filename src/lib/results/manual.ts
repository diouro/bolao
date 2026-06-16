import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchResult, ResultsProvider } from "@/lib/results/provider";

export class ManualResultsProvider implements ResultsProvider {
  async getMatchResult(matchId: string): Promise<MatchResult | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("matches")
      .select("id, home_score, away_score")
      .eq("id", matchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.home_score === null || data.away_score === null) {
      return null;
    }

    return {
      matchId: data.id,
      homeScore: data.home_score,
      awayScore: data.away_score,
    };
  }
}
