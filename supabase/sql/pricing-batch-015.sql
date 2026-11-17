-- Batch 15, active catalogue rows 1401-1500.
-- Retail-only baseline = exact Kenyan retail price x 0.85; markup tier then nearest KSh50.
-- Reductions are limited to items with multiple comparable prices >25% above market average.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('trinity-gold-452wp-fungicide-5kg',13299.00::numeric,9500.00::numeric,7301.50::numeric),
('tronic-ik-7011-10-10w-uv-a-insect-killer',3850.00::numeric,4150.00::numeric,3187.50::numeric),
('tronic-ik-7011-15-15w-uv-a-insect-killer',3850.00::numeric,4550.00::numeric,3485.00::numeric),
('tronic-ik-7039-20-20w-eco-friendly-insect-killer',4099.00::numeric,5650.00::numeric,4335.00::numeric),
('tronic-ik-ga80-80w-commercial-insect-killer',29999.00::numeric,31850.00::numeric,25474.50::numeric),
('tronic-ik-gc20-20w-insect-killer',9450.00::numeric,10500.00::numeric,8070.75::numeric),
('tronic-ik-gc30-30w-insect-killer',8650.00::numeric,9950.00::numeric,7650.00::numeric),
('tronic-ik-gc40-40w-insect-killer',12350.00::numeric,13650.00::numeric,10480.50::numeric),
('uv-stabilised-hdpe-insect-net-3m-x-50m',19500.00::numeric,16600.00::numeric,12750.00::numeric),
('tvs-hlx-100cc-chain-and-sprocket-kit-n8320100',2699.00::numeric,2750.00::numeric,2124.15::numeric),
('tvs-hlx-150-4gear-chain-sprocket-kit-szn6320660-fresh',3199.00::numeric,3400.00::numeric,2612.90::numeric),
('tvs-hlx-150-clutch-assembly-primary-gear-2060t132-fresh-20261108',2450.00::numeric,2700.00::numeric,2082.50::numeric),
('tvs-hlx-150-clutch-boss-hub-disc-2061t131-fresh-20261108',1000.00::numeric,1100.00::numeric,850.00::numeric),
('tvs-hlx-125-150-clutch-bearing-6201-420602000-fresh-20261108',400.00::numeric,450.00::numeric,340.00::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 15 price guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;

-- Additional exact-model Turbo TR20 listing, in stock at Logike Kenya.
do $pricing$
declare affected integer;
begin
 update public.products set price=12700.00,cost=9775.00
 where id='turbo-tr20-20l-2-in-1-manual-and-battery-knapsack-sprayer'
   and active=true and price=10150.00;
 get diagnostics affected=row_count;
 if affected<>1 then raise exception 'Batch 15 Turbo TR20 guard failed (expected 10150, changed %)',affected; end if;
end
$pricing$;
commit;
