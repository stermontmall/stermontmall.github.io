-- Batch 2 pricing review, created 2026-11-17.
-- Review-branch SQL only; NOT executed against the live database.
-- Guard each change against the exact captured current price and active status.
begin;
do $pricing$
declare
  r record;
  affected integer;
begin
  for r in
    select * from (values
      ('acetak-top-700wg-insecticide-5g', 199.00::numeric, 150.00::numeric),
      ('acrobat-69-wg-fungicide-1kg', 3399.00::numeric, 4450.00::numeric),
      ('agromectin-18-ec-insecticide-50ml', 299.00::numeric, 300.00::numeric),
      ('agroz-bag-plus-hermetic-grain-storage-bag-100kg', 350.00::numeric, 400.00::numeric),
      ('aico-0-5hp-deep-well-submersible-pump-80m-head', 19498.70::numeric, 24050.00::numeric),
      ('aico-japan-ac767-4-25l-4-stroke-petrol-knapsack-sprayer', 24700.00::numeric, 27500.00::numeric),
      ('ailyons-2-in-1-blender-with-grinder-1-6l-4-speed-safety-lock', 1399.00::numeric, 1900.00::numeric),
      ('albafas-10-albendazole-drench-1-litre', 1050.00::numeric, 1150.00::numeric)
    ) as v(product_id, expected_price, new_price)
  loop
    update public.products
       set price = r.new_price
     where id = r.product_id
       and active = true
       and price = r.expected_price;
    get diagnostics affected = row_count;
    if affected <> 1 then
      raise exception 'Batch 2 price guard failed for %: expected current price %, rows changed %',
        r.product_id, r.expected_price, affected;
    end if;
  end loop;
end
$pricing$;
commit;
