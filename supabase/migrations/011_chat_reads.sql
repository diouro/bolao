create table if not exists public.chat_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_reads enable row level security;

drop trigger if exists touch_chat_reads_updated_at on public.chat_reads;
create trigger touch_chat_reads_updated_at
before update on public.chat_reads
for each row execute function public.touch_updated_at();

drop policy if exists "users can read own chat read state" on public.chat_reads;
create policy "users can read own chat read state"
on public.chat_reads for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can create own chat read state" on public.chat_reads;
create policy "users can create own chat read state"
on public.chat_reads for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own chat read state" on public.chat_reads;
create policy "users can update own chat read state"
on public.chat_reads for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_reads'
  ) then
    alter publication supabase_realtime add table public.chat_reads;
  end if;
end $$;
