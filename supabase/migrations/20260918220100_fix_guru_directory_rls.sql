-- This migration records the production RLS rule applied to public.guru.
-- Guru accounts can access only their linked identity; admins can access all active rows.
drop policy if exists guru_authenticated_read on public.guru;
create policy guru_authenticated_read on public.guru
for select to authenticated
using (private.is_admin() or id = private.current_guru_id());
