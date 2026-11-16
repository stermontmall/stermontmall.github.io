-- Stermont Arcade: additive SEO metadata foundation.
-- Existing product slugs and seo_title remain authoritative; no customer/order data is changed.

alter table public.products
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists alt_text text,
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists stock_status text generated always as (
    case when coalesce(stock, 0) > 0 then 'in_stock' else 'out_of_stock' end
  ) stored;

alter table public.categories
  add column if not exists description text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists keywords text[] not null default '{}'::text[];

-- Preserve the already-approved SEO titles. Do not overwrite them with generic templates.
update public.products
set meta_title = coalesce(nullif(btrim(meta_title), ''), nullif(btrim(seo_title), '')),
    meta_description = coalesce(
      nullif(btrim(meta_description), ''),
      nullif(left(regexp_replace(coalesce(description, ''), '\\s+', ' ', 'g'), 155), '')
    ),
    alt_text = coalesce(nullif(btrim(alt_text), ''), nullif(btrim(name), ''))
where meta_title is null or meta_description is null or alt_text is null;

update public.categories
set meta_title = coalesce(nullif(btrim(meta_title), ''), nullif(btrim(name), '') || ' | Stermont Arcade')
where meta_title is null or btrim(meta_title) = '';

-- Slug uniqueness is required for deterministic static routes. Existing data was audited
-- and has no duplicate non-null product/category slugs before creating these indexes.
create unique index if not exists products_slug_unique_seo_idx
  on public.products (slug)
  where slug is not null and btrim(slug) <> '';

create unique index if not exists categories_slug_unique_seo_idx
  on public.categories (slug)
  where slug is not null and btrim(slug) <> '';

create index if not exists products_active_stock_status_idx
  on public.products (stock_status, slug)
  where active = true;

comment on column public.products.meta_title is
  'Approved SERP title; initialized from seo_title. Keep aligned with seo_title when editing.';
comment on column public.products.meta_description is
  'Unique search snippet for the generated product page; editor-reviewed, max 160 characters recommended.';
comment on column public.products.alt_text is
  'Accessible alternative text for the primary product image; avoid keyword stuffing.';
comment on column public.products.keywords is
  'Editorial keyword research notes; not emitted as a meta keywords tag.';
comment on column public.products.stock_status is
  'Generated from stock; use for Product Offer availability and storefront status.';
comment on column public.categories.description is
  'Editorial category introduction used in category landing pages.';
comment on column public.categories.meta_title is
  'Category page SERP title.';
comment on column public.categories.meta_description is
  'Unique category page search snippet.';
comment on column public.categories.keywords is
  'Editorial keyword research notes; not emitted as a meta keywords tag.';
