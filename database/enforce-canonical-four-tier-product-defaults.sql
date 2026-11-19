-- Owner-approved 2026-11-20.
-- Enforce the canonical four-tier price and new-product defaults at the database boundary.
-- Existing product updates are not repriced by this INSERT-only rule.

create or replace function public.products_posting_rules()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    if new.id is null or new.id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'products.id must be lowercase letters, digits and single hyphens (got %)', new.id;
    end if;
    if coalesce(new.name, '') ilike '%syngenta%' then
      raise exception 'Syngenta products are excluded from automatic pricing unless the owner explicitly instructs otherwise';
    end if;
    if new.cost is null or new.cost <= 0 then
      raise exception 'A verified positive KES baseline cost is required for every new product';
    end if;

    new.cost := round(new.cost, 2);
    new.price := public.price_4tier(new.cost);
    new.stock := 1000;
    new.low_at := 20;
    new.featured := false;
    new.active := false;
    new.slug := new.id;
  end if;

  if new.active is true and coalesce(cardinality(new.images), 0) = 0 then
    raise exception 'A product must have at least one verified photo in images before it can be published or remain active. Upload and verify the product photo first.';
  end if;
  return new;
end;
$function$;

-- New inserts use the official nearest-KSh-50 price. Existing edits retain the
-- legacy charm-price behaviour and are not automatically recalculated.
create or replace function public.products_round_prices()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  b numeric;
begin
  if new.price is not null then
    if tg_op = 'INSERT' then
      new.price := round(new.price / 50) * 50;
    else
      b := floor(new.price / 100) * 100;
      new.price := (select min(b + o) from unnest(array[0,50,99,100]) o where b + o >= new.price);
    end if;
  end if;

  if new.old_price is not null then
    if tg_op = 'INSERT' then
      new.old_price := round(new.old_price / 50) * 50;
      if new.price is not null and new.old_price <= new.price then
        new.old_price := new.price + 50;
      end if;
    else
      b := floor(new.old_price / 100) * 100;
      new.old_price := (select min(b + o) from unnest(array[0,50,99,100]) o where b + o >= new.old_price);
      if new.price is not null and new.old_price <= new.price then
        b := floor((new.price + 1) / 100) * 100;
        new.old_price := (select min(b + o) from unnest(array[0,50,99,100]) o where b + o >= new.price + 1);
      end if;
    end if;
  end if;
  return new;
end;
$function$;
