create table if not exists public.match_comments (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists match_comments_match_created_idx
on public.match_comments (match_id, created_at desc);

create index if not exists match_comments_user_idx
on public.match_comments (user_id);

alter table public.match_comments enable row level security;

drop policy if exists "authenticated users can read match comments" on public.match_comments;
create policy "authenticated users can read match comments"
on public.match_comments for select
to authenticated
using (true);

drop policy if exists "users can create own match comments" on public.match_comments;
create policy "users can create own match comments"
on public.match_comments for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can delete own match comments" on public.match_comments;
create policy "users can delete own match comments"
on public.match_comments for delete
to authenticated
using (user_id = auth.uid());
