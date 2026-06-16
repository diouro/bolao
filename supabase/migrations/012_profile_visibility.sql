alter table public.profiles
add column if not exists deleted_at timestamptz;

create index if not exists profiles_visibility_idx
on public.profiles (deleted_at);

create or replace function public.is_active_user()
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
      and deleted_at is null
  );
$$;

create or replace function public.is_active_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and deleted_at is null
  );
$$;

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
      and deleted_at is null
  );
$$;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles for select
to authenticated
using (deleted_at is null);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() and deleted_at is null)
with check (id = auth.uid() and deleted_at is null);

drop policy if exists "authenticated users can read matches" on public.matches;
create policy "authenticated users can read matches"
on public.matches for select
to authenticated
using (public.is_active_user());

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
using (public.is_active_user() and public.is_active_profile(user_id));

drop policy if exists "users can create own predictions" on public.predictions;
create policy "users can create own predictions"
on public.predictions for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can update own predictions" on public.predictions;
create policy "users can update own predictions"
on public.predictions for update
to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can delete own predictions" on public.predictions;
create policy "users can delete own predictions"
on public.predictions for delete
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "authenticated users can read match comments" on public.match_comments;
create policy "authenticated users can read match comments"
on public.match_comments for select
to authenticated
using (public.is_active_user() and public.is_active_profile(user_id));

drop policy if exists "users can create own match comments" on public.match_comments;
create policy "users can create own match comments"
on public.match_comments for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can delete own match comments" on public.match_comments;
create policy "users can delete own match comments"
on public.match_comments for delete
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "authenticated users can read chat messages" on public.chat_messages;
create policy "authenticated users can read chat messages"
on public.chat_messages for select
to authenticated
using (public.is_active_user() and public.is_active_profile(user_id));

drop policy if exists "users can create own chat messages" on public.chat_messages;
create policy "users can create own chat messages"
on public.chat_messages for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can delete own chat messages" on public.chat_messages;
create policy "users can delete own chat messages"
on public.chat_messages for delete
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can read own mention clears" on public.mention_clears;
create policy "users can read own mention clears"
on public.mention_clears for select
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can create own mention clears" on public.mention_clears;
create policy "users can create own mention clears"
on public.mention_clears for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can delete own mention clears" on public.mention_clears;
create policy "users can delete own mention clears"
on public.mention_clears for delete
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can read own chat read state" on public.chat_reads;
create policy "users can read own chat read state"
on public.chat_reads for select
to authenticated
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can create own chat read state" on public.chat_reads;
create policy "users can create own chat read state"
on public.chat_reads for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "users can update own chat read state" on public.chat_reads;
create policy "users can update own chat read state"
on public.chat_reads for update
to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());
