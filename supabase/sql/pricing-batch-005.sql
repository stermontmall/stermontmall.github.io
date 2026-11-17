-- Batch 5 price changes. Retail-estimate baselines use lowest reputable in-stock Kenyan retail × 0.85.
-- Profit guard: decreases only where current price is >25% above average of multiple comparable Kenyan retail listings.
-- Branch review only; not applied to production.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('belt-480sc-insecticide-50ml',1399.00::numeric,1500.00::numeric),
('belt-480sc-insecticide-1l',26999.00::numeric,28500.00::numeric),
('bugati-500-sc-fungicide-50ml',1499.00::numeric,1650.00::numeric),
('boma-rhodes-1kg',1699.00::numeric,2000.00::numeric),
('bromarat-0-005-rb-rodent-bait-25-g',850.00::numeric,1100.00::numeric),
('bromarat-0-005-rb-rodent-bait-100-g',1350.00::numeric,1650.00::numeric),
('basf-goliath-cockroach-gel-bait-35g',13650.00::numeric,9350.00::numeric),
('celebrat-a27-wireless-headphones',3650.00::numeric,2800.00::numeric),
('celebrat-a35-wireless-headphones',2899.00::numeric,2450.00::numeric),
('celebrat-a41-active-noise-cancelling-headphones',4550.00::numeric,3850.00::numeric),
('celebrat-w25-wireless-earbuds',2299.00::numeric,1650.00::numeric),
('celebrat-w61-wireless-earbuds',2899.00::numeric,2000.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 5 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
