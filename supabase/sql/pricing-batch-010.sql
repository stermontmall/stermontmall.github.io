-- Batch 10 guarded price updates and two verified Levafas Diamond pack variants.
-- Retail-estimate baseline = lowest current Kenyan in-stock retail × 0.85.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('levafas-diamond-fluke-and-worm-drench-1-litre',2450.00::numeric,1900.00::numeric),
('lg-lhd657-1000w-5-1-channel-home-theatre-system-1000w-5-1-ch',38999.00::numeric,41450.00::numeric),
('menno-florades-90sl-disinfectant-1l',4799.00::numeric,5150.00::numeric),
('menno-florades-90sl-disinfectant-250ml',1399.00::numeric,1400.00::numeric),
('matco-72wp-fungicide-1kg',2950.00::numeric,2000.00::numeric),
('matco-72wp-fungicide-500g',1550.00::numeric,1000.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 10 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;

insert into public.products
(id,category_id,name,price,cost,stock,low_at,featured,active,images,description,unit,slug,seo_name,seo_title,meta_title,meta_description,alt_text,keywords,stock_status,variant_group,variant_label)
values
('levafas-diamond-fluke-and-worm-drench-125ml',40,'Levafas Diamond Fluke & Worm Drench 125ml',400,323,1000,20,true,true,(select images from public.products where id='levafas-diamond-fluke-and-worm-drench-1-litre'),'Levafas Diamond Fluke & Worm Drench 125ml is a Norbrook Levafas Diamond oral livestock drench for the control of flukes and worms. This listing is for one 125ml bottle. The manufacturer and Kenyan supplier listings identify Levafas Diamond as a veterinary anthelmintic/flukicide. Confirm the exact species, indication, administration route, dose, contraindications, withdrawal period for meat and milk, and any veterinary restrictions from the current product label and a qualified veterinary professional before use. Do not use the dose for another pack, species or formulation. Keep the product in its original closed container away from food, animal feed and children. Buy Levafas Diamond Fluke & Worm Drench 125ml in Kenya from Stermont Arcade with M-Pesa checkout and nationwide delivery.','125ml bottle','levafas-diamond-fluke-and-worm-drench-125ml','Levafas Diamond Fluke & Worm Drench 125ml','Levafas Diamond Fluke & Worm Drench 125ml – Price in Kenya','Levafas Diamond Fluke & Worm Drench 125ml – Price in Kenya','Buy Levafas Diamond Fluke & Worm Drench 125ml in Kenya at Stermont Arcade. M-Pesa checkout, Nairobi pickup or delivery to all 47 counties.','Levafas Diamond Fluke & Worm Drench 125ml',ARRAY['Levafas Diamond 125ml','Levafas Diamond price Kenya','Norbrook livestock drench Kenya','Levafas Diamond 125ml price in Kenya'],'in_stock','levafas-diamond-fluke-and-worm-drench','125ml'),
('levafas-diamond-fluke-and-worm-drench-500ml',40,'Levafas Diamond Fluke & Worm Drench 500ml',1100,850,1000,20,true,true,(select images from public.products where id='levafas-diamond-fluke-and-worm-drench-1-litre'),'Levafas Diamond Fluke & Worm Drench 500ml is a Norbrook Levafas Diamond oral livestock drench for the control of flukes and worms. This listing is for one 500ml bottle. The manufacturer and Kenyan supplier listings identify Levafas Diamond as a veterinary anthelmintic/flukicide. Confirm the exact species, indication, administration route, dose, contraindications, withdrawal period for meat and milk, and any veterinary restrictions from the current product label and a qualified veterinary professional before use. Do not use the dose for another pack, species or formulation. Keep the product in its original closed container away from food, animal feed and children. Buy Levafas Diamond Fluke & Worm Drench 500ml in Kenya from Stermont Arcade with M-Pesa checkout and nationwide delivery.','500ml bottle','levafas-diamond-fluke-and-worm-drench-500ml','Levafas Diamond Fluke & Worm Drench 500ml','Levafas Diamond Fluke & Worm Drench 500ml – Price in Kenya','Levafas Diamond Fluke & Worm Drench 500ml – Price in Kenya','Buy Levafas Diamond Fluke & Worm Drench 500ml in Kenya at Stermont Arcade. M-Pesa checkout, Nairobi pickup or delivery to all 47 counties.','Levafas Diamond Fluke & Worm Drench 500ml',ARRAY['Levafas Diamond 500ml','Levafas Diamond price Kenya','Norbrook livestock drench Kenya','Levafas Diamond 500ml price in Kenya'],'in_stock','levafas-diamond-fluke-and-worm-drench','500ml')
on conflict (id) do nothing;

update public.products set variant_group='levafas-diamond-fluke-and-worm-drench',variant_label='1L' where id='levafas-diamond-fluke-and-worm-drench-1-litre';
commit;
