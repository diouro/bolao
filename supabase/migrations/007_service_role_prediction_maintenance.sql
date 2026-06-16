create or replace function public.prevent_late_prediction()
returns trigger
language plpgsql
as $$
declare
  kickoff timestamptz;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  select kickoff_at into kickoff from public.matches where id = new.match_id;

  if kickoff <= now() then
    raise exception 'Predictions are locked after kickoff.';
  end if;

  return new;
end;
$$;
