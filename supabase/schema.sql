-- Tables backing the Mob Console frontend.
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- Note: "create table if not exists" skips a table that already exists even if its
-- columns differ, so re-running this file does not repair a table that has drifted
-- from the definition below. Compare against the live schema before assuming they
-- match — Dashboard -> Table Editor, or select from information_schema.columns.

create table if not exists public.notifications (
  id text primary key,
  package text not null,
  title text not null,
  text text not null,
  posted_at bigint not null,
  timestamp bigint not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_items_created_at_idx
  on public.gallery_items (created_at desc);

create table if not exists public.mobile_photos (
  id uuid primary key default gen_random_uuid(),
  photo_id bigint not null,
  display_name text not null,
  path text not null,
  size bigint not null,
  date_added bigint not null,
  date_modified bigint not null,
  image_data bytea not null,
  synced_at timestamptz not null default now(),
  unique(photo_id)
);

create index if not exists mobile_photos_photo_id_idx
  on public.mobile_photos (photo_id);

create index if not exists mobile_photos_synced_at_idx
  on public.mobile_photos (synced_at desc);

-- Uploads from POST /api/images/upload. Unlike mobile_photos, the bytes are not
-- stored here: they go to the "mobile-images" storage bucket and this table keeps
-- the metadata plus the object path the public URL is built from.
create table if not exists public.mobile_images (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  filepath text not null,
  filesize bigint not null,
  mime_type text not null,
  storage_path text not null unique,
  timestamp bigint not null,
  date_added bigint not null,
  date_modified bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists mobile_images_created_at_idx
  on public.mobile_images (created_at desc);

-- The frontend reads with the publishable (anon) key, so row level security
-- needs an explicit read policy. No write policy is granted: inserts and
-- updates must go through a server-side route using a secret key.
alter table public.notifications enable row level security;
alter table public.gallery_items enable row level security;
alter table public.mobile_photos enable row level security;
alter table public.mobile_images enable row level security;

drop policy if exists "notifications are readable" on public.notifications;
create policy "notifications are readable"
  on public.notifications for select
  to anon, authenticated
  using (true);

drop policy if exists "gallery items are readable" on public.gallery_items;
create policy "gallery items are readable"
  on public.gallery_items for select
  to anon, authenticated
  using (true);

drop policy if exists "mobile photos are readable" on public.mobile_photos;
create policy "mobile photos are readable"
  on public.mobile_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "mobile images are readable" on public.mobile_images;
create policy "mobile images are readable"
  on public.mobile_images for select
  to anon, authenticated
  using (true);

-- Storage bucket for POST /api/images/upload. Public, so the storageUrl returned
-- by the upload can be opened directly — a public bucket needs no select policy of
-- its own. Uploads go through the route handler with the secret key, which bypasses
-- storage RLS. Creating it here is a no-op if it already exists; if this statement
-- is rejected, create the bucket from Dashboard -> Storage instead.
insert into storage.buckets (id, name, public)
values ('mobile-images', 'mobile-images', true)
on conflict (id) do nothing;
