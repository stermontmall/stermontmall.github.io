-- Batch 1 pricing review, created 2026-11-17.
-- This file is a review-branch migration script. It has NOT been executed against the live database.
-- Every update is guarded by the expected current price and active flag; a mismatch aborts the transaction.
begin;
do $pricing$
declare
  r record;
  affected integer;
begin
  for r in
    select * from (values
      ('1-l-rabbit-drinker-with-steel-nipple-and-wall-bracket', 1170.00::numeric, 1150.00::numeric),
      ('3-litre-manual-chicken-drinker', 399.00::numeric, 450.00::numeric),
      ('3kg-poultry-feeder-with-anti-waste-separator-ring', 499.00::numeric, 450.00::numeric),
      ('40-litre-poultry-drinker-with-automatic-cup-drinkers', 2600.00::numeric, 2550.00::numeric),
      ('5-kg-broiler-chicken-feeder', 499.00::numeric, 550.00::numeric),
      ('64-egg-automatic-incubator-with-digital-controls', 16900.00::numeric, 15600.00::numeric),
      ('64-egg-incubator-wq-jf-64-220v-or-12v-auto-turning', 19110.00::numeric, 19100.00::numeric),
      ('528-egg-commercial-automatic-incubator', 71500.00::numeric, 66000.00::numeric),
      ('1056-egg-fully-automatic-commercial-incubator', 104000.00::numeric, 76400.00::numeric),
      ('abalone-18ec-insecticide-50ml', 199.00::numeric, 200.00::numeric),
      ('accent-600sc-insecticide-50ml', 650.00::numeric, 650.00::numeric),
      ('4pcs-sticky-ribbon-fly-catcher-trap', 599.00::numeric, 600.00::numeric)
    ) as v(product_id, expected_price, new_price)
  loop
    update public.products
       set price = r.new_price
     where id = r.product_id
       and active = true
       and price = r.expected_price;
    get diagnostics affected = row_count;
    if affected <> 1 then
      raise exception 'Batch 1 price guard failed for %: expected current price %, rows changed %',
        r.product_id, r.expected_price, affected;
    end if;
  end loop;
end
$pricing$;
commit;
