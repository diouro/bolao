alter table public.matches
add column if not exists home_team_name text,
add column if not exists away_team_name text,
add column if not exists external_home_team_id text,
add column if not exists external_away_team_id text;
