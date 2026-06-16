export type MatchResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type SyncResultsSummary = {
  provider: string;
  checked: number;
  updated: number;
  skipped: number;
};

export interface ResultsProvider {
  getMatchResult(matchId: string): Promise<MatchResult | null>;
  syncFinishedMatches?(): Promise<SyncResultsSummary>;
}
