do $$ begin
  create type public.pool_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  invite_code text not null unique check (char_length(invite_code) between 6 and 32),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.pool_members (
  pool_id uuid not null references public.pools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.pool_role not null default 'member',
  has_paid boolean not null default false,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (pool_id, user_id)
);

create index if not exists pool_members_user_active_idx
on public.pool_members (user_id)
where left_at is null;

create index if not exists pools_invite_code_idx
on public.pools (invite_code);

alter table public.chat_messages
add column if not exists pool_id uuid references public.pools(id) on delete cascade;

alter table public.match_comments
add column if not exists pool_id uuid references public.pools(id) on delete cascade;

alter table public.chat_reads
add column if not exists pool_id uuid references public.pools(id) on delete cascade;

alter table public.mention_clears
add column if not exists pool_id uuid references public.pools(id) on delete cascade;

do $$
declare
  v_pool_id uuid;
  v_owner_id uuid;
  v_invite_code text;
begin
  if exists (select 1 from public.pools where slug = 'friends') then
    return;
  end if;

  select id
  into v_owner_id
  from public.profiles
  where deleted_at is null
  order by case when role = 'admin' then 0 else 1 end, created_at
  limit 1;

  if v_owner_id is null then
    return;
  end if;

  v_invite_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.pools (name, slug, invite_code, created_by)
  values ('Friends', 'friends', v_invite_code, v_owner_id)
  returning id into v_pool_id;

  insert into public.pool_members (pool_id, user_id, role, has_paid, joined_at)
  select
    v_pool_id,
    p.id,
    case when p.role = 'admin' then 'owner'::public.pool_role else 'member'::public.pool_role end,
    p.has_paid,
    p.created_at
  from public.profiles p
  where p.deleted_at is null;

  update public.chat_messages set pool_id = v_pool_id where pool_id is null;
  update public.match_comments set pool_id = v_pool_id where pool_id is null;
  update public.chat_reads set pool_id = v_pool_id where pool_id is null;
  update public.mention_clears set pool_id = v_pool_id where pool_id is null;
end $$;

alter table public.chat_reads drop constraint if exists chat_reads_pkey;
alter table public.mention_clears drop constraint if exists mention_clears_pkey;

alter table public.chat_messages alter column pool_id set not null;
alter table public.match_comments alter column pool_id set not null;
alter table public.chat_reads alter column pool_id set not null;
alter table public.mention_clears alter column pool_id set not null;

alter table public.chat_reads
add constraint chat_reads_pkey primary key (pool_id, user_id);

alter table public.mention_clears
add constraint mention_clears_pkey primary key (pool_id, user_id, source, source_id);

create index if not exists chat_messages_pool_created_idx
on public.chat_messages (pool_id, created_at desc);

create index if not exists match_comments_pool_match_idx
on public.match_comments (pool_id, match_id, created_at desc);

create index if not exists mention_clears_pool_user_idx
on public.mention_clears (pool_id, user_id, created_at desc);

create or replace function public.is_pool_member(p_pool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pool_members
    where pool_id = p_pool_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;

create or replace function public.is_pool_admin(p_pool_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pool_members
    where pool_id = p_pool_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and left_at is null
  );
$$;

create or replace function public.users_share_pool(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pool_members pm1
    join public.pool_members pm2 on pm1.pool_id = pm2.pool_id
    where pm1.user_id = p_user_a
      and pm2.user_id = p_user_b
      and pm1.left_at is null
      and pm2.left_at is null
  );
$$;

alter table public.pools enable row level security;
alter table public.pool_members enable row level security;

drop policy if exists "members can read pools" on public.pools;
create policy "members can read pools"
on public.pools for select
to authenticated
using (public.is_pool_member(id) or created_by = auth.uid());

drop policy if exists "authenticated users can create pools" on public.pools;
create policy "authenticated users can create pools"
on public.pools for insert
to authenticated
with check (created_by = auth.uid() and public.is_active_user());

drop policy if exists "pool admins can update pools" on public.pools;
create policy "pool admins can update pools"
on public.pools for update
to authenticated
using (public.is_pool_admin(id))
with check (public.is_pool_admin(id));

drop policy if exists "members can read pool members" on public.pool_members;
create policy "members can read pool members"
on public.pool_members for select
to authenticated
using (public.is_pool_member(pool_id) or user_id = auth.uid());

drop policy if exists "users can join pools" on public.pool_members;
create policy "users can join pools"
on public.pool_members for insert
to authenticated
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "pool admins can update pool members" on public.pool_members;
create policy "pool admins can update pool members"
on public.pool_members for update
to authenticated
using (public.is_pool_admin(pool_id))
with check (public.is_pool_admin(pool_id));

drop policy if exists "users can leave pools" on public.pool_members;
create policy "users can leave pools"
on public.pool_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated users can read chat messages" on public.chat_messages;
create policy "authenticated users can read chat messages"
on public.chat_messages for select
to authenticated
using (public.is_pool_member(pool_id) and public.is_active_user());

drop policy if exists "users can create own chat messages" on public.chat_messages;
create policy "users can create own chat messages"
on public.chat_messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can delete own chat messages" on public.chat_messages;
create policy "users can delete own chat messages"
on public.chat_messages for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "authenticated users can read match comments" on public.match_comments;
create policy "authenticated users can read match comments"
on public.match_comments for select
to authenticated
using (public.is_pool_member(pool_id) and public.is_active_user());

drop policy if exists "users can create own match comments" on public.match_comments;
create policy "users can create own match comments"
on public.match_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can delete own match comments" on public.match_comments;
create policy "users can delete own match comments"
on public.match_comments for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can read own chat read state" on public.chat_reads;
create policy "users can read own chat read state"
on public.chat_reads for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can create own chat read state" on public.chat_reads;
create policy "users can create own chat read state"
on public.chat_reads for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can update own chat read state" on public.chat_reads;
create policy "users can update own chat read state"
on public.chat_reads for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
)
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can read own mention clears" on public.mention_clears;
create policy "users can read own mention clears"
on public.mention_clears for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can create own mention clears" on public.mention_clears;
create policy "users can create own mention clears"
on public.mention_clears for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "users can delete own mention clears" on public.mention_clears;
create policy "users can delete own mention clears"
on public.mention_clears for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_pool_member(pool_id)
  and public.is_active_user()
);

drop policy if exists "authenticated users can read predictions" on public.predictions;
create policy "authenticated users can read predictions"
on public.predictions for select
to authenticated
using (
  public.is_active_user()
  and public.is_active_profile(user_id)
  and (
    user_id = auth.uid()
    or public.users_share_pool(auth.uid(), user_id)
  )
);

grant select, insert, update, delete on public.pools to authenticated;
grant select, insert, update, delete on public.pool_members to authenticated;

grant all on public.pools to postgres, service_role;
grant all on public.pool_members to postgres, service_role;
