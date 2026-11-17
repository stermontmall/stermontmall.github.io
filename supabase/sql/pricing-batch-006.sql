-- Batch 6: guarded price updates plus three newly verified commercial pack variants.
-- Retail-estimate baseline = lowest reliable Kenyan in-stock retail × 0.85; rounded to nearest KSh50.
-- Review branch only; not applied to production.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('chariot-500-sc-fungicide-1-litre',3199.00::numeric,2200.00::numeric),
('dap-18-46-0-fertilizer-50kg',7650.00::numeric,4750.00::numeric),
('dk777-hybrid-maize-seeds-2kg',1300.00::numeric,600.00::numeric)
 ) as v(product_id,expected_price,new_price)
 loop
  update public.products set price=r.new_price where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 6 guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;

-- New Chariot 500SC commercial packs: supplier-confirmed in-stock prices, exact formulation.
insert into public.products
(id,category_id,name,price,cost,stock,low_at,featured,active,images,description,unit,slug,seo_name,seo_title,meta_title,meta_description,alt_text,keywords,stock_status)
values
('chariot-500-sc-fungicide-100ml',71,'Chariot 500 SC Fungicide 100ml',350,263.50,1000,20,true,true,(select images from public.products where id='chariot-500-sc-fungicide-1-litre'),
'Chariot 500 SC Fungicide 100ml is a carbendazim 500 g/L suspension concentrate. This listing is for one 100ml bottle. The Kenya supplier listing identifies this formulation for crop-protection uses including Botrytis in roses, angular leaf spot and Botrytis in French beans, early blight in tomatoes and rice blast in rice, subject to the current PCPB-approved label. Confirm the exact crop, disease, application method, dose, re-entry interval and pre-harvest interval on the original product label before use. Wear all label-required protective equipment and prevent contamination of water, food and animal feed. Buy Chariot 500 SC Fungicide 100ml in Kenya from Stermont Arcade, with M-Pesa checkout and delivery across Kenya.',
'100ml bottle','chariot-500-sc-fungicide-100ml','Chariot 500 SC Fungicide 100ml','Chariot 500 SC Fungicide 100ml – Price in Kenya','Chariot 500 SC Fungicide 100ml – Price in Kenya','Buy Chariot 500 SC Fungicide 100ml in Kenya at Stermont Arcade. M-Pesa checkout, Nairobi pickup or delivery to all 47 counties.','Chariot 500 SC Fungicide 100ml',ARRAY['Chariot 500 SC 100ml','Chariot 500SC price in Kenya','Carbendazim 500 g/L Kenya','Buy Chariot fungicide 100ml'], 'in_stock'),
('chariot-500-sc-fungicide-250ml',71,'Chariot 500 SC Fungicide 250ml',800,624.75,1000,20,true,true,(select images from public.products where id='chariot-500-sc-fungicide-1-litre'),
'Chariot 500 SC Fungicide 250ml is a carbendazim 500 g/L suspension concentrate. This listing is for one 250ml bottle. The Kenya supplier listing identifies this formulation for crop-protection uses including Botrytis in roses, angular leaf spot and Botrytis in French beans, early blight in tomatoes and rice blast in rice, subject to the current PCPB-approved label. Confirm the exact crop, disease, application method, dose, re-entry interval and pre-harvest interval on the original product label before use. Wear all label-required protective equipment and prevent contamination of water, food and animal feed. Buy Chariot 500 SC Fungicide 250ml in Kenya from Stermont Arcade, with M-Pesa checkout and delivery across Kenya.',
'250ml bottle','chariot-500-sc-fungicide-250ml','Chariot 500 SC Fungicide 250ml','Chariot 500 SC Fungicide 250ml – Price in Kenya','Chariot 500 SC Fungicide 250ml – Price in Kenya','Buy Chariot 500 SC Fungicide 250ml in Kenya at Stermont Arcade. M-Pesa checkout, Nairobi pickup or delivery to all 47 counties.','Chariot 500 SC Fungicide 250ml',ARRAY['Chariot 500 SC 250ml','Chariot 500SC price in Kenya','Carbendazim 500 g/L Kenya','Buy Chariot fungicide 250ml'], 'in_stock'),
('commander-240-ec-herbicide-100ml',70,'Commander 240EC Herbicide 100ml',450,340,1000,20,true,true,(select images from public.products where id='commander-240-ec-herbicide-1-litre'),
'Commander 240EC Herbicide 100ml is a selective contact herbicide containing oxyfluorfen 240 g/L. This listing is for one 100ml pack. Kenyan supplier information identifies its use for control of annual broadleaf and grass weeds in specified crops including onions, garlic and brassicas, subject to the current PCPB-approved label. Check that the crop, timing and application method are permitted on the product label. Follow label directions for dose, protective equipment, re-entry and environmental precautions; do not use on unlisted crops or assume a rate from another pack or brand. Buy Commander 240EC Herbicide 100ml in Kenya from Stermont Arcade with M-Pesa checkout and nationwide delivery.',
'100ml bottle','commander-240-ec-herbicide-100ml','Commander 240EC Herbicide 100ml','Commander 240EC Herbicide 100ml – Price in Kenya','Commander 240EC Herbicide 100ml – Price in Kenya','Buy Commander 240EC Herbicide 100ml in Kenya at Stermont Arcade. M-Pesa checkout, Nairobi pickup or delivery to all 47 counties.','Commander 240EC Herbicide 100ml',ARRAY['Commander 240EC 100ml','Commander herbicide price Kenya','Oxyfluorfen 240 g/L Kenya','Buy Commander 240EC 100ml'], 'in_stock')
on conflict (id) do nothing;
commit;
