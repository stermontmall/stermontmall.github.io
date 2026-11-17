-- Batch 11, active catalogue rows 1001-1100.
-- Retail-only baseline = lowest reliable in-stock Kenyan retailer x 0.85; rounded to nearest KSh50.
-- Price reductions only where multiple comparable retailers show current storefront price >25% above market average.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('omron-m1-basic-automatic-upper-arm-blood-pressure-monitor-22-32-cm-cuf',6499.00::numeric,4650.00::numeric),
('norbrook-milking-salve-100-g',450.00::numeric,150.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 11 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
