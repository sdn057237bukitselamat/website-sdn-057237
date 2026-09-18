create table if not exists public.gallery_photos (
  id bigint generated always as identity primary key,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  caption text check (caption is null or char_length(caption) <= 1000),
  category text not null default 'kegiatan' check (category in ('upacara','kebugaran','pramuka','belajar','literasi','prestasi','kegiatan','lainnya')),
  storage_path text not null unique check (storage_path like 'galeri/%'),
  public_url text not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_active_created_at_idx
  on public.gallery_photos (created_at desc)
  where active = true;

create index if not exists gallery_photos_uploaded_by_idx
  on public.gallery_photos (uploaded_by);

alter table public.gallery_photos enable row level security;

drop policy if exists "gallery_public_read_active" on public.gallery_photos;
create policy "gallery_public_read_active"
on public.gallery_photos for select to anon, authenticated
using (active = true);

drop policy if exists "gallery_admin_select_all" on public.gallery_photos;
create policy "gallery_admin_select_all"
on public.gallery_photos for select to authenticated
using ((select private.is_admin()));

drop policy if exists "gallery_admin_insert" on public.gallery_photos;
create policy "gallery_admin_insert"
on public.gallery_photos for insert to authenticated
with check ((select private.is_admin()) and uploaded_by = (select auth.uid()));

drop policy if exists "gallery_admin_update" on public.gallery_photos;
create policy "gallery_admin_update"
on public.gallery_photos for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "gallery_admin_delete" on public.gallery_photos;
create policy "gallery_admin_delete"
on public.gallery_photos for delete to authenticated
using ((select private.is_admin()));

grant select on public.gallery_photos to anon, authenticated;
grant insert, update, delete on public.gallery_photos to authenticated;
grant usage, select on sequence public.gallery_photos_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-media', 'website-media', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "website_media_public_read" on storage.objects;
create policy "website_media_public_read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'website-media');

drop policy if exists "website_media_admin_insert" on storage.objects;
create policy "website_media_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'website-media' and name like 'galeri/%' and (select private.is_admin()));

drop policy if exists "website_media_admin_update" on storage.objects;
create policy "website_media_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'website-media' and name like 'galeri/%' and (select private.is_admin()))
with check (bucket_id = 'website-media' and name like 'galeri/%' and (select private.is_admin()));

drop policy if exists "website_media_admin_delete" on storage.objects;
create policy "website_media_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'website-media' and name like 'galeri/%' and (select private.is_admin()));

create or replace function private.prevent_last_admin_demote()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.role = 'admin' and new.role <> 'admin' then
    if not exists (
      select 1 from public.profiles
      where role = 'admin' and id <> old.id
    ) then
      raise exception 'Tidak dapat menurunkan admin terakhir. Tetapkan admin pengganti terlebih dahulu.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_admin_demote on public.profiles;
create trigger profiles_prevent_last_admin_demote
before update of role on public.profiles
for each row
execute function private.prevent_last_admin_demote();
