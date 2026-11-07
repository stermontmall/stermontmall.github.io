-- Restores the old rule "a product with no image is forced back to draft" (removed 2026-11-07 at the owner's request).
-- Run this to turn the rule back on.
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
    new.slug := new.id;
  end if;

  if new.active and coalesce(array_length(new.images, 1), 0) = 0 then
    new.active := false;
  end if;

  return new;
end;
$function$;
