-- Batch 9 guarded price changes. Baselines are lowest verified current Kenyan retail × 0.85.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('infinix-smart-20-4gb-64gb-20261108',15700.00::numeric,16300.00::numeric),
('infinix-hot-70-4gb-128gb-20261108',20499.00::numeric,21000.00::numeric),
('infinix-note-50-pro-8gb-256gb-20261108',30499.00::numeric,31350.00::numeric),
('integra-organo-silicone-spray-adjuvant-1l',3300.00::numeric,3600.00::numeric),
('kenpoly-4-litre-poultry-drinker',499.00::numeric,400.00::numeric),
('kenpoly-4l-poultry-drinker-with-water-level-window',455.00::numeric,400.00::numeric),
('kato-germany-3-inch-7-5hp-petrol-water-pump',23400.00::numeric,19900.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 9 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
