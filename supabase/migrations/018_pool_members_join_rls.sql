-- Users must read their own membership rows (including after leaving) so
-- rejoin updates are visible. Upsert also needs UPDATE policies to pass
-- even for new inserts; plain insert + update avoids that footgun.
drop policy if exists "members can read pool members" on public.pool_members;
create policy "members can read pool members"
on public.pool_members for select
to authenticated
using (public.is_pool_member(pool_id) or user_id = auth.uid());
