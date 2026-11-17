-- Batch 17, final 47 active catalogue rows 1601-1647.
-- Retail-only baseline = lowest reliable current Kenyan retail x 0.85; markup tier then KSh50 rounding.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('yaravita-crop-boost-foliar-fertilizer-1l',1400.00::numeric,1600.00::numeric,1232.50::numeric),
('yaravita-powerboost-foliar-fertilizer-1l',800.00::numeric,1650.00::numeric,1266.50::numeric),
('xiaomi-air-fryer-essential-6l',9499.00::numeric,9950.00::numeric,7649.15::numeric),
('xiaomi-dual-zone-air-fryer-10l',18999.00::numeric,19900.00::numeric,15299.15::numeric),
('xiaomi-smart-air-fryer-4-5l',12999.00::numeric,13800.00::numeric,10624.15::numeric),
('xiaomi-poco-c71-3gb-ram-plus-64gb-3gb-plus-64gb',14299.00::numeric,14900.00::numeric,11474.15::numeric),
('xiaomi-redmi-15c-8gb-ram-plus-256gb-8gb-plus-256gb',20899.00::numeric,24300.00::numeric,18699.15::numeric),
('xiaomi-electric-glass-kettle-1-7l',4099.00::numeric,4500.00::numeric,3450.00::numeric),
('xiaomi-electric-kettle-2-lite-1-5l',4099.00::numeric,5150.00::numeric,3943.01::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 17 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
