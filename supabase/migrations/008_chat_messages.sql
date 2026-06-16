create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_idx
on public.chat_messages (created_at desc);

create index if not exists chat_messages_user_idx
on public.chat_messages (user_id);

alter table public.chat_messages enable row level security;

drop policy if exists "authenticated users can read chat messages" on public.chat_messages;
create policy "authenticated users can read chat messages"
on public.chat_messages for select
to authenticated
using (true);

drop policy if exists "users can create own chat messages" on public.chat_messages;
create policy "users can create own chat messages"
on public.chat_messages for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can delete own chat messages" on public.chat_messages;
create policy "users can delete own chat messages"
on public.chat_messages for delete
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
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
