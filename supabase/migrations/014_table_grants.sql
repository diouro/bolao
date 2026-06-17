-- Hosted Supabase applies these grants automatically; local `supabase start` does not.
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated, anon;

alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges for role postgres in schema public
grant select on tables to anon;

alter default privileges for role postgres in schema public
grant usage, select on sequences to authenticated, anon;
