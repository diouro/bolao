-- INSERT ... RETURNING requires SELECT access on the new row. During pool
-- creation the membership row does not exist yet, so creators must be able
-- to read pools they created.
drop policy if exists "members can read pools" on public.pools;
create policy "members can read pools"
on public.pools for select
to authenticated
using (public.is_pool_member(id) or created_by = auth.uid());
