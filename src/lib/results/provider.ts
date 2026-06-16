export type MatchResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export interface ResultsProvider {
  getMatchResult(matchId: string): Promise<MatchResult | null>;
  syncFinishedMatches?(): Promise<void>;
}
