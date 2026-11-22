-- Neon service-media support (2026-11-23)
-- Apply to the Neon branch used by the Stermont Arcade admin and public site.
-- Object Storage bucket "service-media" is provisioned separately as public_read.

create table if not exists public.service_posts (
  id uuid primary key default gen_random_uuid(),
  service_slug text,
  kind text not null default 'update'
    check (kind in ('update','completed','before_after','tip','offer')),
  title text not null check (char_length(title) between 1 and 140),
  town text,
  body text check (body is null or char_length(body) <= 2000),
  media jsonb not null default '[]'::jsonb
    check (jsonb_typeof(media) = 'array'),
  published boolean not null default true,
  pinned boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_posts enable row level security;

drop policy if exists service_posts_public_read on public.service_posts;
create policy service_posts_public_read
  on public.service_posts for select to anonymous
  using (published = true);

drop policy if exists service_posts_admin_all on public.service_posts;
create policy service_posts_admin_all
  on public.service_posts for all to authenticated
  using (public.is_store_admin())
  with check (public.is_store_admin());

grant select on public.service_posts to anonymous, authenticated;
grant insert, update, delete, select on public.service_posts to authenticated;
