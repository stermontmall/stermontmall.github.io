-- Category meta_description backfill, grouped by vertical (2026-11-16).
-- Fills ONLY categories whose meta_description is NULL or blank; hand-written values are never overwritten.
-- Scope: categories with active products plus their ancestors (the 66 active categories).
-- Every template is single-spaced, trimmed and at most 155 characters; rows that would exceed 155 are skipped, not truncated.
with recursive active as (
  select distinct category_id as id from public.products where active and category_id is not null
), tree as (
  select c.id, c.parent_id from public.categories c join active a on a.id = c.id
  union
  select c.id, c.parent_id from public.categories c join tree t on c.id = t.parent_id
), roots as (
  select c.id, c.slug, c.name, c.parent_id, c.id as root_id
  from public.categories c where c.parent_id is null
  union all
  select c.id, c.slug, c.name, c.parent_id, r.root_id
  from public.categories c join roots r on c.parent_id = r.id
), computed as (
  select c.id,
    regexp_replace(btrim(case
      when c.slug = 'stermont-cars-for-sale' then
        'Browse brand-new cars for sale in Kenya. Confirm availability and the supplier quote first, then pay by M-Pesa. Sarit Centre enquiries welcome.'
      when c.slug in ('motorcycle-spare-parts', 'motorcycle-accessories') then
        format('Buy %s in Kenya. Check your bike model and part fitment first. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', c.name)
      when c.slug in ('car-accessories-parts', 'automotive') then
        format('Shop %s in Kenya. Match the part to your car model before ordering. Pay by M-Pesa; Sarit Centre pickup, delivery to 47 counties.', c.name)
      when c.slug = 'protective-wear-safety' then
        format('Buy %s in Kenya: PPE for farms, workshops and sites. Pay by M-Pesa; Sarit Centre pickup or delivery to all 47 counties.', c.name)
      when r.root_id = 31 then
        format('Buy %s in Kenya for homes, shops and farms. Pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', c.name)
      when r.root_id = 1 then
        format('Buy %s in Kenya for your farm. Compare pack sizes and prices. Pay by M-Pesa; Sarit Centre pickup or delivery to 47 counties.', c.name)
      when r.root_id in (75, 76, 78, 4) then
        format('Shop %s in Kenya. Compare models and prices, pay by M-Pesa. Sarit Centre pickup, delivery to all 47 counties.', c.name)
      when r.root_id in (79) or c.slug = 'supermarket' then
        format('Shop %s for your home in Kenya. Pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', c.name)
      when r.root_id in (5, 12, 13, 14, 9) then
        format('Shop %s in Kenya. Browse styles and prices, pay by M-Pesa. Sarit Centre pickup or delivery to all 47 counties.', c.name)
      else
        format('Shop %s in Kenya. Compare listed products and prices, pay by M-Pesa. Sarit Centre pickup, delivery to 47 counties.', c.name)
    end), '\s+', ' ', 'g') as md
  from public.categories c
  join tree t on t.id = c.id
  join roots r on r.id = c.id
)
update public.categories c
set meta_description = k.md
from computed k
where c.id = k.id
  and (c.meta_description is null or btrim(c.meta_description) = '')
  and length(k.md) <= 155;
