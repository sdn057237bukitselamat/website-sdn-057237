-- Contact form storage for public website submissions.
-- Public visitors may insert only; only administrators can read/update messages.
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nama text not null check (char_length(trim(nama)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 5 and 254),
  subject text not null check (char_length(trim(subject)) between 2 and 120),
  message text not null check (char_length(trim(message)) between 5 and 5000),
  status text not null default 'baru' check (status in ('baru','dibaca','dibalas','arsip'))
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon;
grant select, update on table public.contact_messages to authenticated;

create policy "contact_public_insert"
on public.contact_messages
for insert
to anon
with check (
  char_length(trim(nama)) between 2 and 120
  and char_length(trim(email)) between 5 and 254
  and char_length(trim(subject)) between 2 and 120
  and char_length(trim(message)) between 5 and 5000
);

create policy "contact_admin_select"
on public.contact_messages
for select
to authenticated
using (private.is_admin());

create policy "contact_admin_update"
on public.contact_messages
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

revoke all on sequence public.contact_messages_id_seq from anon, authenticated;
grant usage, select on sequence public.contact_messages_id_seq to anon, authenticated;
