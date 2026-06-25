update public.matches
set
  home_team_code = null,
  away_team_code = null,
  home_slot = '1E',
  away_slot = '3ABCDF'
where id = 'wc2026-r32-15';

update public.matches
set
  home_team_code = null,
  away_team_code = null,
  home_slot = '1A',
  away_slot = '3CEFHI'
where id = 'wc2026-r32-5';

update public.matches
set
  home_team_code = null,
  away_team_code = null,
  home_slot = '1D',
  away_slot = '3BEFIJ'
where id = 'wc2026-r32-7';

-- Move any stray picks/comments off duplicate football-data knockout rows.
update public.predictions
set match_id = 'wc2026-r32-15'
where match_id = 'fd-537415'
  and not exists (
    select 1
    from public.predictions existing
    where existing.user_id = predictions.user_id
      and existing.match_id = 'wc2026-r32-15'
  );

update public.predictions
set match_id = 'wc2026-r32-5'
where match_id = 'fd-537425'
  and not exists (
    select 1
    from public.predictions existing
    where existing.user_id = predictions.user_id
      and existing.match_id = 'wc2026-r32-5'
  );

update public.predictions
set match_id = 'wc2026-r32-7'
where match_id = 'fd-537421'
  and not exists (
    select 1
    from public.predictions existing
    where existing.user_id = predictions.user_id
      and existing.match_id = 'wc2026-r32-7'
  );

update public.predictions
set match_id = 'wc2026-r32-11'
where match_id = 'fd-537427'
  and not exists (
    select 1
    from public.predictions existing
    where existing.user_id = predictions.user_id
      and existing.match_id = 'wc2026-r32-11'
  );

delete from public.predictions
where match_id in ('fd-537415', 'fd-537425', 'fd-537421', 'fd-537427');

update public.match_comments
set match_id = 'wc2026-r32-15'
where match_id = 'fd-537415';

update public.match_comments
set match_id = 'wc2026-r32-5'
where match_id = 'fd-537425';

update public.match_comments
set match_id = 'wc2026-r32-7'
where match_id = 'fd-537421';

update public.match_comments
set match_id = 'wc2026-r32-11'
where match_id = 'fd-537427';

delete from public.matches
where id in ('fd-537415', 'fd-537425', 'fd-537421', 'fd-537427');
