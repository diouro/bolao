create table if not exists public.mention_clears (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('chat', 'match_comment')),
  source_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, source, source_id)
);

create index if not exists mention_clears_user_created_idx
on public.mention_clears (user_id, created_at desc);

alter table public.mention_clears enable row level security;

drop policy if exists "users can read own mention clears" on public.mention_clears;
create policy "users can read own mention clears"
on public.mention_clears for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can create own mention clears" on public.mention_clears;
create policy "users can create own mention clears"
on public.mention_clears for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can delete own mention clears" on public.mention_clears;
create policy "users can delete own mention clears"
on public.mention_clears for delete
to authenticated
using (user_id = auth.uid());

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mention_clears'
  ) then
    alter publication supabase_realtime add table public.mention_clears;
  end if;
end $$;
