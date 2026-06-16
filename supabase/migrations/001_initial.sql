create extension if not exists "pgcrypto";

do $$ begin
  create type public.profile_role as enum ('player', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_round as enum (
    'group',
    'round_of_32',
    'round_of_16',
    'quarter_final',
    'semi_final',
    'third_place',
    'final'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.match_status as enum ('scheduled', 'live', 'finished');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  avatar_url text,
  role public.profile_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  tournament_id text not null default 'wc2026',
  round public.match_round not null,
  group_code text,
  home_team_code text,
  away_team_code text,
  home_slot text,
  away_slot text,
  kickoff_at timestamptz not null,
  venue text,
  status public.match_status not null default 'scheduled',
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_home_value_check check (home_team_code is not null or home_slot is not null),
  constraint matches_away_value_check check (away_team_code is not null or away_slot is not null),
  constraint matches_result_complete_check check (
    (home_score is null and away_score is null and status <> 'finished')
    or (home_score is not null and away_score is not null)
  )
);

create table if not exists public.predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0 and home_score <= 30),
  away_score integer not null check (away_score >= 0 and away_score <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_at);
create index if not exists matches_round_idx on public.matches (round, group_code);
create index if not exists predictions_match_idx on public.predictions (match_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_matches_updated_at on public.matches;
create trigger touch_matches_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

drop trigger if exists touch_predictions_updated_at on public.predictions;
create trigger touch_predictions_updated_at
before update on public.predictions
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.prevent_late_prediction()
returns trigger
language plpgsql
as $$
declare
  kickoff timestamptz;
begin
  select kickoff_at into kickoff from public.matches where id = new.match_id;

  if kickoff <= now() then
    raise exception 'Predictions are locked after kickoff.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_late_prediction_insert on public.predictions;
create trigger prevent_late_prediction_insert
before insert on public.predictions
for each row execute function public.prevent_late_prediction();

drop trigger if exists prevent_late_prediction_update on public.predictions;
create trigger prevent_late_prediction_update
before update on public.predictions
for each row execute function public.prevent_late_prediction();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'avatar_url',
    'player'
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "authenticated users can read matches" on public.matches;
create policy "authenticated users can read matches"
on public.matches for select
to authenticated
using (true);

drop policy if exists "admins can manage matches" on public.matches;
create policy "admins can manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated users can read predictions" on public.predictions;
create policy "authenticated users can read predictions"
on public.predictions for select
to authenticated
using (true);

drop policy if exists "users can create own predictions" on public.predictions;
create policy "users can create own predictions"
on public.predictions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own predictions" on public.predictions;
create policy "users can update own predictions"
on public.predictions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can delete own predictions" on public.predictions;
create policy "users can delete own predictions"
on public.predictions for delete
to authenticated
using (user_id = auth.uid());
