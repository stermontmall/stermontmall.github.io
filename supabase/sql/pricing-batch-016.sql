-- Batch 16, active catalogue rows 1501-1600.
-- Retail-estimate baseline = lowest matched Kenyan retail x 0.85; markup tier then nearest KSh50.
-- Reductions are only applied where multiple comparable prices show current price >25% above market average.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('vision-plus-vpwm12tt-12kg-twin-tub-washing-machine',31999.00::numeric,32950.00::numeric,26345.75::numeric),
('vivo-v50-lite-4g-8gb-256gb-20261108',34999.00::numeric,36650.00::numeric,29325.00::numeric),
('vitron-htc4300qfs-qled-android-smart-tv-with-wall-mount-43-inch',21499.00::numeric,21650.00::numeric,16659.15::numeric),
('von-vadz0002k-portable-water-dispenser',1150.00::numeric,950.00::numeric,722.50::numeric),
('von-vaf050dstk-5l-slim-digital-air-fryer',8999.00::numeric,9950.00::numeric,7645.75::numeric),
('von-vct-220dbcx-2-burner-gas-cooker',4599.00::numeric,4950.00::numeric,3820.75::numeric),
('von-vft-42246-dmk-42-inch-tower-fan',9999.00::numeric,14350.00::numeric,11045.75::numeric),
('von-vkdg156smk-1-5l-digital-kettle',5850.00::numeric,4950.00::numeric,3820.75::numeric),
('von-vms-206mmk-20l-solo-microwave',7599.00::numeric,8300.00::numeric,6370.75::numeric),
('von-vrc5716nmx-5l-rice-cooker',5199.00::numeric,4400.00::numeric,3395.75::numeric),
('von-vsm211ax-2-slice-sandwich-maker',2299.00::numeric,2550.00::numeric,1950.75::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 16 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;


do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('von-vgs161hsk-1600w-handheld-garment-steamer',5199.00::numeric,3850.00::numeric,2965.65::numeric),
('von-vms-206dgk-20l-digital-solo-microwave',8499.00::numeric,8850.00::numeric,6795.75::numeric),
('von-vpc613xmk-6l-electric-pressure-cooker',9999.00::numeric,11050.00::numeric,8495.75::numeric),
('wq-528-egg-incubator-auto-45-degree-turning-led-displays',63700.00::numeric,66300.00::numeric,55250.00::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 16 additional guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
