-- Tailored, per-vertical category meta descriptions (2026-11-16, Africa/Nairobi).
-- Replaces ONLY text written by the earlier generic backfill (migration 20261116082753
-- category_meta_description_backfill) or blank values. Any description that does not match
-- the old generated patterns is treated as hand-written and is never overwritten.
-- Scope: the "active" category tree = categories with at least one active product, plus their ancestors.
-- Every row changed is first copied into public.categories_meta_backup_20261116 (RLS on, no policies).
-- Rollback: update public.categories c set meta_description = b.meta_description
--           from public.categories_meta_backup_20261116 b where b.id = c.id;

create table if not exists public.categories_meta_backup_20261116 (
  id bigint primary key,
  slug text,
  meta_description text,
  backed_up_at timestamptz not null default now()
);
alter table public.categories_meta_backup_20261116 enable row level security;

with recursive active as (
  select distinct category_id as id from public.products where active and category_id is not null
), tree as (
  select c.id, c.parent_id from public.categories c join active a on a.id = c.id
  union
  select c.id, c.parent_id from public.categories c join tree t on c.id = t.parent_id
), roots as (
  select c.id, c.parent_id, c.id as root_id from public.categories c where c.parent_id is null
  union all
  select c.id, c.parent_id, r.root_id from public.categories c join roots r on c.parent_id = r.id
), grp as (
  select c.id, c.slug, c.name, c.meta_description as old_md, r.root_id,
    case
      when c.slug = 'stermont-cars-for-sale' then 'cars'
      when c.slug in ('motorcycle-spare-parts', 'motorcycle-accessories') then 'moto'
      when c.slug in ('automotive', 'car-accessories-parts') then 'auto'
      when c.slug = 'protective-wear-safety' then 'ppe'
      when r.root_id = 31 and c.parent_id is null then 'pest_root'
      when r.root_id = 31 and c.slug in ('sprayers-equipment', 'fogging-ulv-machines', 'insect-light-traps-uv-lamps', 'pest-monitoring-inspection-tools') then 'pest_equip'
      when r.root_id = 31 then 'pest_chem'
      when r.root_id = 1 and c.parent_id is null then 'agro_root'
      when r.root_id = 1 and c.slug in ('herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators', 'agrochemicals') then 'agro_protect'
      when r.root_id = 1 and c.slug in ('poultry-dairy-equipment', 'water-tanks-irrigation', 'farm-garden-tools') then 'agro_equip'
      when r.root_id = 1 then 'agro_inputs'
      when r.root_id = 4 then 'appliances'
      when r.root_id = 75 then 'phones'
      when r.root_id = 76 then 'tv_audio'
      when r.root_id = 78 then 'computers'
      when r.root_id = 79 then 'home'
      when r.root_id = 5 then 'fashion'
      when r.root_id = 12 then 'shoes'
      when r.root_id in (13, 14) then 'accessories'
      when c.slug = 'medical-supplies' then 'medical'
      when r.root_id = 9 then 'beauty'
      when r.root_id = 11 then 'kids'
      when c.slug = 'tools-machinery' then 'tools'
      when c.slug = 'garden-outdoors' then 'garden'
      when c.slug = 'sporting-goods-fitness' then 'sports'
      when c.slug = 'others' then 'others'
      else 'general'
    end as g
  from public.categories c
  join tree t on t.id = c.id
  join roots r on r.id = c.id
), computed as (
  select id, slug, name, g, old_md,
    regexp_replace(btrim(case g
      when 'cars' then 'Browse brand-new cars for sale in Kenya. Confirm availability and the supplier quote first, then pay by M-Pesa. Sarit Centre enquiries welcome.'
      when 'moto' then format('Need %s in Kenya for your boda or bike? Match the part to your model first. Pay by M-Pesa; Sarit Centre pickup or 47-county delivery.', name)
      when 'auto' then 'Car and motorcycle parts in Kenya: match each part to your model before ordering. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.'
      when 'ppe' then 'Safety gear in Kenya: gloves, respirators, reflective vests, earmuffs and safety shoes. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.'
      when 'pest_root' then 'Pest control products in Kenya: killers, fumigants, traps and sprayers. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.'
      when 'pest_chem' then format('Struggling with pests? Buy %s in Kenya for homes, hotels and farms. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'pest_equip' then format('Spray, fog and monitor pests properly: buy %s in Kenya. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'agro_root' then 'Agrovet shop in Kenya: animal feeds, vet drugs, seeds, fertilizers and agrochemicals. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.'
      when 'agro_protect' then format('Protect your crops: buy %s in Kenya. Check the label first. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'agro_inputs' then format('Buy %s for your Kenyan farm. Compare pack sizes and prices, pay by M-Pesa. Sarit Centre pickup or delivery to 47 counties.', name)
      when 'agro_equip' then format('Shop %s for your farm in Kenya. See sizes and prices, then pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'appliances' then format('Shop %s in Kenya. Compare brands, capacity and prices before you buy. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'phones' then format('Buy %s in Kenya. Check the model and specs first, then pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'tv_audio' then format('Shop %s in Kenya. Check the model and size you need. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'computers' then format('Buy %s in Kenya for work, school and business. Check the specs, pay by M-Pesa. Sarit Centre pickup or delivery to 47 counties.', name)
      when 'home' then format('Make your home work: shop %s in Kenya. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'fashion' then format('Dress sharp: shop %s in Kenya. Check sizes and colours before ordering. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'shoes' then format('Find your fit: buy %s in Kenya. Check your size before ordering, pay by M-Pesa. Sarit Centre pickup or delivery to 47 counties.', name)
      when 'accessories' then format('Shop %s in Kenya for gifts and everyday wear. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'medical' then format('Buy %s in Kenya. Check the details and pack size, then pay by M-Pesa. Sarit Centre pickup or delivery to 47 counties.', name)
      when 'beauty' then format('Shop %s in Kenya for skincare and personal care. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'kids' then format('Shop %s in Kenya. Check the age range before ordering, pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'tools' then format('Shop %s in Kenya: feed grinders, pellet machines, shredders and more. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'garden' then format('Grow more: shop %s in Kenya, from growing media to crop nets. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', name)
      when 'sports' then format('Get active: shop %s in Kenya. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', name)
      when 'others' then 'More everyday essentials in Kenya: tools, garden, safety gear and more. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.'
      else format('Shop %s in Kenya. See listed products and prices, pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', name)
    end), '\s+', ' ', 'g') as md
  from grp
), eligible as (
  select id, slug, md, old_md
  from computed
  where length(md) <= 155
    and md is distinct from old_md
    and (
      old_md is null
      or btrim(old_md) = ''
      -- text written by the earlier generic backfill (anything else is hand-written and is left alone)
      or old_md like any (array[
        '% in Kenya for your farm. Compare pack sizes and prices. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.',
        '% in Kenya for homes, shops and farms. Pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.',
        '% in Kenya. Compare models and prices, pay by M-Pesa. Sarit Centre pickup, delivery to all 47 counties.',
        '% for your home in Kenya. Pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.',
        '% in Kenya. Browse styles and prices, pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.',
        '% in Kenya. Compare listed products and prices, pay by M-Pesa. Sarit Centre pickup, delivery to 47 counties.',
        '% in Kenya. Check your bike model and part fitment first. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.',
        '% in Kenya. Match the part to your car model before ordering. Pay by M-Pesa; Sarit Centre pickup, delivery to 47 counties.',
        '% in Kenya: PPE for farms, workshops and sites. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.'
      ])
    )
), bk as (
  insert into public.categories_meta_backup_20261116 (id, slug, meta_description)
  select id, slug, old_md from eligible
  on conflict (id) do nothing
  returning id
)
update public.categories c
set meta_description = e.md
from eligible e
where c.id = e.id;

-- Safety net: abort (roll the whole migration back) if any description breaks the rules.
do $$
declare bad int;
begin
  select count(*) into bad from public.categories
   where meta_description is not null and length(meta_description) > 155;
  if bad > 0 then raise exception 'category meta_description over 155 chars: % rows', bad; end if;

  select count(*) into bad from public.categories
   where meta_description is not null and meta_description not ilike '%M-Pesa%';
  if bad > 0 then raise exception 'category meta_description missing M-Pesa: % rows', bad; end if;

  select count(*) - count(distinct meta_description) into bad from public.categories
   where meta_description is not null and btrim(meta_description) <> '';
  if bad > 0 then raise exception 'duplicate category meta_description values: %', bad; end if;
end $$;
