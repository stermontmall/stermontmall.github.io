-- Permanent internal product codes for every Stermont Arcade catalogue record.
-- Safe to rerun: existing product IDs, slugs, prices, stock and manufacturer identifiers are preserved.
begin;

lock table public.products in access exclusive mode;

create sequence if not exists public.products_product_code_seq;

alter table public.products
  add column if not exists product_code text;

with numbered as (
  select id, row_number() over (order by created_at nulls first, id) as n
  from public.products
  where product_code is null or btrim(product_code) = ''
)
update public.products p
set product_code = 'STM-' || lpad(numbered.n::text, 6, '0')
from numbered
where p.id = numbered.id;

select setval(
  'public.products_product_code_seq'::regclass,
  coalesce(
    (select max(substring(product_code from 5)::bigint)
     from public.products
     where product_code ~ '^STM-[0-9]+$'),
    0
  ) + 1,
  false
);

alter table public.products
  alter column product_code set default (
    'STM-' || lpad(nextval('public.products_product_code_seq'::regclass)::text, 6, '0')
  ),
  alter column product_code set not null;

create unique index if not exists products_product_code_uidx
  on public.products (product_code);

alter table public.products
  drop constraint if exists products_product_code_format_check;

alter table public.products
  add constraint products_product_code_format_check
  check (product_code ~ '^STM-[0-9]{6,}$');

create or replace function public.guard_products_product_code()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.product_code is null or btrim(new.product_code) = '' then
      new.product_code := 'STM-' || lpad(nextval('public.products_product_code_seq'::regclass)::text, 6, '0');
    end if;
  elsif new.product_code is distinct from old.product_code then
    raise exception 'Product code is permanent and cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_product_code_guard on public.products;
create trigger trg_products_product_code_guard
before insert or update of product_code on public.products
for each row execute function public.guard_products_product_code();

grant usage, select on sequence public.products_product_code_seq to authenticated, service_role;

commit;
