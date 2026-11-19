-- Canonical Stermont Arcade new-product selling-price calculator.
-- Called by the staff catalog before saving every new product or pack variant.
-- Existing-product edits are not repriced by this function.
create or replace function public.price_4tier(p_baseline numeric)
returns numeric
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  b numeric := p_baseline;
  m numeric;
  p numeric;
begin
  if b is null or b <= 0 then
    raise exception 'baseline cost must be a positive KES amount';
  end if;
  m := case
    when b < 20000 then 1.30
    when b < 40000 then 1.25
    when b <= 60000 then 1.20
    else 1.175
  end;
  p := greatest(b * m, b * 1.15);
  p := round(p / 50) * 50;
  return greatest(p, 200);
end
$function$;

comment on function public.price_4tier(numeric) is
'Default Stermont Arcade new-product pricing: 30% below KSh 20,000; 25% from KSh 20,000 to 39,999; 20% from KSh 40,000 to 60,000; 17.5% above KSh 60,000; 15% minimum floor; nearest KSh 50; KSh 200 minimum.';
