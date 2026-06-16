create or replace function public.prevent_late_prediction()
returns trigger
language plpgsql
as $$
declare
  kickoff timestamptz;
  lock_minutes integer;
begin
  select kickoff_at
  into kickoff
  from public.matches
  where id = new.match_id;

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
