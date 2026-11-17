-- Batch 7 guarded price changes. Baseline is lowest reliable Kenyan in-stock retail × 0.85.
-- Lowered items meet the >25% overpriced vs multiple-comparable-market-average exception.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('fugo-chick-and-duckling-mash-50kg',5499.00::numeric,4000.00::numeric),
('fugo-fast-gro-broiler-finisher-pellets-50kg',5699.00::numeric,3850.00::numeric),
('fugo-fast-gro-broiler-starter-crumbs-50kg',6199.00::numeric,4100.00::numeric),
('fugo-grower-mash-50kg',4550.00::numeric,3750.00::numeric),
('evergrow-organic-fertilizer-50kg',4699.00::numeric,2700.00::numeric),
('falcon-npk-17-17-17-fertilizer-50kg',5199.00::numeric,5900.00::numeric),
('ear-tag-applicator',1799.00::numeric,1850.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 7 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
