-- Migration 014 grants only covered tables that existed at the time.
-- pools and pool_members were added in 015 without service_role grants.
grant all on public.pools to postgres, service_role;
grant all on public.pool_members to postgres, service_role;
