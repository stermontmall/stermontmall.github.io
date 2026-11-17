-- Batch 3 non-Syngenta price changes, created 2026-11-17.
-- Review-branch SQL only; not executed on production. Guards verify captured current prices.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('aliette-wg80-systemic-fungicide-1kg',6250.00::numeric,5500.00::numeric),
('alpha-king-10-ec-insecticide-50ml',199.00::numeric,150.00::numeric),
('alpha-king-insecticide-1l',2750.00::numeric,2500.00::numeric),
('aluminium-milking-can-20l',11050.00::numeric,9400.00::numeric),
('amimax-720-wp-fungicide-1kg',2250.00::numeric,1950.00::numeric),
('aminika-wh403-hybrid-maize-seeds-2kg',1040.00::numeric,900.00::numeric),
('aminika-wh504-hybrid-maize-seeds-2kg',1040.00::numeric,900.00::numeric),
('aminika-wh507-hybrid-maize-seeds-2kg',1235.00::numeric,900.00::numeric),
('aminika-wh508-hybrid-maize-seeds-2kg',1250.00::numeric,900.00::numeric),
('ampia-gas-brooder',9799.00::numeric,8300.00::numeric),
('ariane-ec-herbicide-1l',5450.00::numeric,4800.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 3 price guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
