export type ProfileRole = "player" | "admin";

export type TournamentRound =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type Team = {
  code: string;
  name: string;
  group?: string;
};

export type TeamSlot = string | { slot: string };

export type FixtureMatch = {
  id: string;
  tournamentId?: string;
  round: TournamentRound;
  group?: string;
  home: TeamSlot;
  away: TeamSlot;
  kickoff: string;
  venue?: string;
};

export type TournamentFixture = {
  tournament: {
    id: string;
    name: string;
    host?: string;
  };
  teams: Team[];
  matches: FixtureMatch[];
};

export type Profile = {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: ProfileRole;
  has_paid: boolean;
  created_at: string;
};

export type Match = {
  id: string;
  tournament_id: string;
  round: TournamentRound;
  group_code: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_slot: string | null;
  away_slot: string | null;
  kickoff_at: string;
  venue: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  external_provider: string | null;
  external_match_id: string | null;
  external_home_team_id: string | null;
  external_away_team_id: string | null;
};

export type Prediction = {
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
};

export type MatchComment = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  author_email: string | null;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type MatchFriendPrediction = Prediction & {
  display_name: string | null;
  email: string | null;
  has_paid: boolean;
};

export type MentionableUser = {
  id: string;
  label: string;
  handle: string;
  email: string;
  has_paid: boolean;
};

export type MatchWithPrediction = Match & {
  prediction?: Prediction | null;
};

export type ScoreBreakdown = {
  points: number;
  exact: boolean;
  result: boolean;
};
