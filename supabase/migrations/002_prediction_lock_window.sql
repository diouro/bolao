create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('prediction_lock_minutes', '5')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "authenticated users can read app settings" on public.app_settings;
create policy "authenticated users can read app settings"
on public.app_settings for select
to authenticated
using (true);

create or replace function public.prevent_late_prediction()
returns trigger
language plpgsql
as $$
declare
  kickoff timestamptz;
  lock_minutes integer;
begin
  select kickoff_at into kickoff from public.matches where id = new.match_id;
  select coalesce(
    (
      select nullif(value, '')::integer
      from public.app_settings
      where key = 'prediction_lock_minutes'
    ),
    5
  ) into lock_minutes;

  if kickoff - make_interval(mins => greatest(lock_minutes, 0)) <= now() then
    raise exception 'Predictions are locked before kickoff.';
  end if;

  return new;
end;
$$;
