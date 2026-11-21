-- Owner-approved 2026-11-20 follow-up.
-- Never fabricate a previous/discount price on a new product INSERT.
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
        new.old_price := null;
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
