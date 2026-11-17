-- Batch 4: Bajaj Boxer parts; all baselines are lowest matched Kenyan official-distributor/retail price less 15% because no published wholesale rate was stated.
-- Prices rounded to KSh50. Branch review only, not applied to production.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('bajaj-boxer-bm100-cdi-ignitor-assembly',2200.00::numeric,2450.00::numeric),
('bajaj-boxer-bm100-complete-lever-assembly',750.00::numeric,850.00::numeric),
('bajaj-boxer-bm100-front-wheel-ball-bearing-6200-kpbb6200',399.00::numeric,450.00::numeric),
('bajaj-boxer-bm100-fuel-tank-cap',650.00::numeric,700.00::numeric),
('bajaj-boxer-bm100-ks-and-bm150-oil-filter-cap',300.00::numeric,350.00::numeric),
('bajaj-boxer-bm100-ks-bm150-and-platina-pl125-chain-tensioner',800.00::numeric,900.00::numeric),
('bajaj-boxer-bm100-ks-chain-and-sprocket-kit',2850.00::numeric,3150.00::numeric),
('bajaj-boxer-bm100-ks-chain-guide-kit',350.00::numeric,400.00::numeric),
('bajaj-boxer-bm100-ks-rotor-assembly',3500.00::numeric,3850.00::numeric),
('bajaj-boxer-bm100-old-model-capacitor-electrolytic',299.00::numeric,300.00::numeric),
('bajaj-boxer-bm100-old-model-cylinder-head',6100.00::numeric,6750.00::numeric),
('bajaj-boxer-bm100-old-model-gear-shift-drum-stopper',250.00::numeric,300.00::numeric),
('bajaj-boxer-bm100-old-model-rear-drum-brake-assembly',3650.00::numeric,4050.00::numeric),
('bajaj-boxer-bm100-rear-sprocket-bearing-6004-kpbc6004',450.00::numeric,500.00::numeric),
('bajaj-boxer-bm100-shock-damper',500.00::numeric,550.00::numeric),
('bajaj-boxer-bm150-5-gear-crankshaft-assembly-pf531033',6199.00::numeric,6850.00::numeric),
('bajaj-boxer-bm150-and-bm100-ks-2nd-gear-drive',950.00::numeric,1050.00::numeric),
('bajaj-boxer-bm150-and-bm100-ks-4th-gear-drive',850.00::numeric,900.00::numeric),
('bajaj-boxer-bm150-and-bm100-ks-side-stand',300.00::numeric,350.00::numeric),
('bajaj-boxer-bm150-and-platina-pl125-headlamp-assembly',300.00::numeric,350.00::numeric),
('bajaj-boxer-bm150-camshaft-assembly',1150.00::numeric,1650.00::numeric),
('bajaj-boxer-bm150-carburettor-assembly',5500.00::numeric,6100.00::numeric),
('bajaj-boxer-bm150-chain-sprocket-kit-fresh-20261108',3199.00::numeric,3550.00::numeric),
('bajaj-boxer-bm150-clutch-cable',400.00::numeric,450.00::numeric),
('bajaj-boxer-bm150-crankcase-lh',7800.00::numeric,8600.00::numeric),
('bajaj-boxer-bm150-crankshaft',5500.00::numeric,6100.00::numeric),
('bajaj-boxer-bm150-exhaust-assembly',12000.00::numeric,13300.00::numeric),
('bajaj-boxer-bm150-front-fork-holder-assembly',1950.00::numeric,2150.00::numeric),
('bajaj-boxer-bm150-front-wheel-axle',300.00::numeric,350.00::numeric),
('bajaj-boxer-bm150-fuel-level-sensor',1199.00::numeric,1200.00::numeric),
('bajaj-boxer-bm150-fuel-tap-assembly',450.00::numeric,500.00::numeric),
('bajaj-boxer-bm150-headlamp-cowling-cocktail-52pf1827',1899.00::numeric,2100.00::numeric),
('bajaj-boxer-bm150-left-handlebar-control-switch',350.00::numeric,400.00::numeric),
('bajaj-boxer-bm150-lock-kit',1950.00::numeric,2150.00::numeric),
('bajaj-boxer-bm150-oil-filter-cap-fresh',300.00::numeric,350.00::numeric),
('bajaj-boxer-bm150-piston-assembly',1500.00::numeric,1650.00::numeric),
('bajaj-boxer-bm150-timing-chain',700.00::numeric,750.00::numeric),
('bajaj-boxer-bm150-wiring-harness',2999.00::numeric,3200.00::numeric),
('bajaj-boxer-bm150-bm100ks-mesh-oil-filter',250.00::numeric,300.00::numeric),
('bajaj-boxer-bm150cc-piston-rings-36pf0116',650.00::numeric,700.00::numeric),
('bajaj-boxer-handle-holder-set',600.00::numeric,650.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 4 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
