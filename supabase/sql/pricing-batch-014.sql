-- Batch 14 guarded price updates. Retail-estimate baseline = lowest in-stock Kenyan retail × 0.85.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('tecno-camon-50-pro-8gb-256gb-20261108',36999.00::numeric,44650.00::numeric,35700.00::numeric),
('tecno-camon-50-8gb-256gb-20261108',32500.00::numeric,35050.00::numeric,28050.00::numeric),
('tecno-pop-20-4gb-64gb-20261108',14999.00::numeric,16350.00::numeric,12579.15::numeric),
('tecno-spark-50-4g-4gb-128gb-20261108',18999.00::numeric,20550.00::numeric,15809.15::numeric),
('tecno-spark-50-4g-8gb-256gb-20261108',24000.00::numeric,25400.00::numeric,19550.00::numeric),
('tecno-spark-50-pro-8gb-256gb-20261108',26500.00::numeric,27100.00::numeric,21674.15::numeric),
('tehno-mss-g010-10-litre-poultry-drinker',799.00::numeric,850.00::numeric,637.50::numeric),
('total-twp215002-2hp-1500w-centrifugal-water-pump',23400.00::numeric,24650.00::numeric,18954.15::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 14 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;

-- Additional verified Batch 14 pricing updates from the supplier/competitor research log.
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('spirometer-500sc-insecticide-100ml',1950.00::numeric,1700.00::numeric,1317.50::numeric),
('taurus-500sp-insecticide-1kg',8000.00::numeric,5800.00::numeric,4462.50::numeric),
('systema-50ec-insecticide-1-litre',4350.00::numeric,3300.00::numeric,2550.00::numeric),
('samsung-43u8000f-crystal-uhd-4k-smart-tv-43-inch',39099.00::numeric,40250.00::numeric,32215.00::numeric),
('symnet-50-mesh-anti-insect-net-3m-x-50m-roll',15499.00::numeric,16600.00::numeric,12750.00::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 14 additional guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
