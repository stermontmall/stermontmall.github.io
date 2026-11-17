-- Batch 13, active catalogue rows 1201-1300.
-- Ransom 600WP is a Greenlife product (not Syngenta); pack sizes and current in-stock retail prices are published by Farm Rescue.
-- New pack retail baselines = exact Kenyan retail x 0.85, then 30% markup, rounded to nearest KSh50.
begin;
update public.products set variant_group='ransom-600-wp-fungicide',variant_label='30g'
where id='ransom-600-wp-fungicide-30g' and variant_group is null;

insert into public.products
(id,category_id,name,price,cost,stock,low_at,featured,active,images,description,unit,variant_group,variant_label,slug,seo_name,seo_title,meta_title,meta_description,alt_text,keywords)
values
('ransom-600-wp-fungicide-100g',71,'Ransom 600 WP Fungicide 100g',550,403.75,1000,20,true,true,(select images from public.products where id='ransom-600-wp-fungicide-30g'),
'Ransom 600 WP Fungicide 100g is a 100 gram wettable powder pack containing carbendazim 570 g/kg and triadimefon 30 g/kg. Greenlife Crop Protection identifies Ransom 600WP for systemic and contact protection against label-listed fungal diseases including powdery mildew, rust and anthracnose. The Kenyan supplier listing confirms the 100g pack and in-stock retail price. Use only for crops, diseases and application methods authorised by the current Kenya-approved product label. Follow the original label for mixing, application rate, spray intervals, protective equipment, re-entry and pre-harvest intervals, compatibility, environmental precautions and disposal. Do not guess a dose or transfer directions from another formulation. Store in the original sealed pack in a secure, dry chemical store away from food, feed, seed, medicines, children and animals. Avoid inhaling powder and wear label-required PPE. Verify the seal, batch and expiry details on delivery. Stermont Arcade supports M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'100g pack','ransom-600-wp-fungicide','100g','ransom-600-wp-fungicide-100g',
'Ransom 600 WP Fungicide 100g','Ransom 600 WP Fungicide 100g Price in Kenya','Ransom 600 WP Fungicide 100g Price in Kenya',
'Buy Ransom 600 WP Fungicide 100g in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Ransom 600 WP Fungicide 100g pack',
ARRAY['Ransom 600 WP 100g','Ransom 600 WP 100g Kenya','Ransom fungicide price in Kenya','Ransom 600WP Kenya']),
('ransom-600-wp-fungicide-250g',71,'Ransom 600 WP Fungicide 250g',950,748,1000,20,true,true,(select images from public.products where id='ransom-600-wp-fungicide-30g'),
'Ransom 600 WP Fungicide 250g is a 250 gram wettable powder pack containing carbendazim 570 g/kg and triadimefon 30 g/kg. Greenlife Crop Protection identifies Ransom 600WP as a systemic and contact fungicide for selected label-listed diseases, including rust and powdery mildew. Farm Rescue lists the 250g pack in stock in Kenya. Before purchase and use, confirm that the crop, disease, formulation and application method are authorised by the current PCPB-approved label. Follow label directions for dose, mixing, spray intervals, PPE, re-entry, pre-harvest intervals, compatibility and disposal. Do not extrapolate application rates from another pack or crop. Keep the sealed original pack in a locked, dry and ventilated chemical store away from food, feed, seed, medicines, children and animals. Avoid inhaling powder and use the protective equipment required by the label and safety data sheet. Check seal, batch and expiry details on receipt. M-Pesa checkout, Nairobi pickup and countrywide delivery are available through Stermont Arcade.',
'250g pack','ransom-600-wp-fungicide','250g','ransom-600-wp-fungicide-250g',
'Ransom 600 WP Fungicide 250g','Ransom 600 WP Fungicide 250g Price in Kenya','Ransom 600 WP Fungicide 250g Price in Kenya',
'Buy Ransom 600 WP Fungicide 250g in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Ransom 600 WP Fungicide 250g pack',
ARRAY['Ransom 600 WP 250g','Ransom 600 WP 250g Kenya','Ransom fungicide price in Kenya','Ransom 600WP Kenya']),
('ransom-600-wp-fungicide-1kg',71,'Ransom 600 WP Fungicide 1kg',3600,2758.25,1000,20,true,true,(select images from public.products where id='ransom-600-wp-fungicide-30g'),
'Ransom 600 WP Fungicide 1kg is a one kilogram wettable powder pack containing carbendazim 570 g/kg and triadimefon 30 g/kg. Greenlife Crop Protection identifies the product as a systemic and contact fungicide for selected crops and diseases listed on the approved label. Farm Rescue confirms the 1kg pack and current in-stock Kenyan retail price. Use only where the current Kenya-approved label permits the crop, target disease and application method. Follow label instructions exactly for preparation, application rate, spray interval, PPE, re-entry and pre-harvest intervals, compatibility, environmental protection and disposal. Never estimate a dose or use it for an unlisted purpose. Keep the original sealed pack in a locked, dry chemical store, separate from food, feed, seed and medicines and inaccessible to children and animals. Avoid inhaling dust; wear the PPE required by the label and safety data sheet. Check the packaging, batch and expiry information on delivery. Stermont Arcade offers M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'1kg pack','ransom-600-wp-fungicide','1kg','ransom-600-wp-fungicide-1kg',
'Ransom 600 WP Fungicide 1kg','Ransom 600 WP Fungicide 1kg Price in Kenya','Ransom 600 WP Fungicide 1kg Price in Kenya',
'Buy Ransom 600 WP Fungicide 1kg in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Ransom 600 WP Fungicide 1kg pack',
ARRAY['Ransom 600 WP 1kg','Ransom 600 WP 1kg Kenya','Ransom fungicide price in Kenya','Ransom 600WP Kenya'])
on conflict (id) do nothing;


-- Batch 13 additional verified price updates (manufacturer/official retailer and in-stock Kenyan listings).
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('samsung-galaxy-a06-4gb-ram-plus-64gb-4gb-plus-64gb',13799.00::numeric,16150.00::numeric,12409.15::numeric),
('samsung-galaxy-a07-5g-4gb-128gb-20261108',22900.00::numeric,24850.00::numeric,19131.80::numeric),
('samsung-galaxy-a17-5g-4gb-128gb-20261108',22499.00::numeric,24850.00::numeric,19131.80::numeric),
('samsung-galaxy-a26-5g-8gb-256gb-20261108',26800.00::numeric,38250.00::numeric,30600.00::numeric),
('samsung-43u8000f-crystal-uhd-4k-smart-tv-43-inch',39099.00::numeric,40250.00::numeric,32215.00::numeric),
('sc-duma-43-hybrid-maize-seeds-2kg',999.00::numeric,1000.00::numeric,765.00::numeric),
('rootex-6-rooting-hormone-50-g',1099.00::numeric,550.00::numeric,442.00::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 13 price guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;
commit;
