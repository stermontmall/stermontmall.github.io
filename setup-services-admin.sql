-- Services admin: photo/video updates, service price + notice overrides, and the media bucket.
-- Run once in the Supabase SQL editor (project oewvtbnmyombbtggamor). Safe to run again.
-- Needs the is_staff() function that setup-service-quotes.sql already uses.

-- 1) Posts: the photos and videos staff send to keep clients posted. Shown on /services/ pages by /services/updates.js.
create table if not exists public.service_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  service_slug text check (service_slug is null or char_length(service_slug) between 2 and 80),
  kind text not null default 'update' check (kind in ('update','before_after','completed','tip','offer')),
  title text not null check (char_length(title) between 2 and 140),
  body text check (body is null or char_length(body) <= 2000),
  town text check (town is null or char_length(town) <= 80),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 12),
  published boolean not null default true,
  pinned boolean not null default false,
  created_by text
);
create index if not exists service_posts_feed_idx on public.service_posts (published, pinned desc, created_at desc);
create index if not exists service_posts_service_idx on public.service_posts (service_slug);
alter table public.service_posts enable row level security;

drop policy if exists "public reads published service posts" on public.service_posts;
create policy "public reads published service posts" on public.service_posts
  for select to anon, authenticated using (published = true);

drop policy if exists "staff manage service posts" on public.service_posts;
create policy "staff manage service posts" on public.service_posts
  for all to public using (is_staff()) with check (is_staff());

-- 2) Catalog overrides: staff can change a service's price range, add a notice, pause bookings or set a cover photo
--    without editing services-data.json. A row exists only for services that were edited.
create table if not exists public.service_catalog (
  slug text primary key check (char_length(slug) between 2 and 80),
  updated_at timestamptz not null default now(),
  updated_by text,
  active boolean not null default true,
  price_min numeric check (price_min is null or price_min >= 0),
  price_max numeric check (price_max is null or price_max >= 0),
  price_open boolean,
  price_note text check (price_note is null or char_length(price_note) <= 400),
  headline text check (headline is null or char_length(headline) <= 160),
  notice text check (notice is null or char_length(notice) <= 300),
  cover_url text check (cover_url is null or char_length(cover_url) <= 500)
);
alter table public.service_catalog enable row level security;

drop policy if exists "public reads service catalog" on public.service_catalog;
create policy "public reads service catalog" on public.service_catalog
  for select to anon, authenticated using (true);

drop policy if exists "staff manage service catalog" on public.service_catalog;
create policy "staff manage service catalog" on public.service_catalog
  for all to public using (is_staff()) with check (is_staff());

-- 3) Storage bucket for the photos and videos. Public read (the files are shown on the public pages); only staff can write.
--    50 MB per file is the free-plan ceiling; photos are shrunk in the browser before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-media', 'service-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "service media staff read" on storage.objects;
create policy "service media staff read" on storage.objects
  for select to authenticated using (bucket_id = 'service-media' and is_staff());

drop policy if exists "service media staff upload" on storage.objects;
create policy "service media staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'service-media' and is_staff());

drop policy if exists "service media staff update" on storage.objects;
create policy "service media staff update" on storage.objects
  for update to authenticated using (bucket_id = 'service-media' and is_staff()) with check (bucket_id = 'service-media' and is_staff());

drop policy if exists "service media staff delete" on storage.objects;
create policy "service media staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'service-media' and is_staff());
