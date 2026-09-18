-- Authenticated guru accounts may read only their own directory row.
-- Administrators retain access to the full active directory.
drop policy if exists guru_authenticated_read on public.guru;
create policy guru_authenticated_read on public.guru
for select to authenticated
using (private.is_admin() or id = private.current_guru_id());
