-- Batch 12, active catalogue rows 1101-1200.
-- Existing product reductions meet the >25% overpriced-vs-multiple-comparable-retailers guard.
-- All new pack variants use lowest in-stock Kenyan retail x 0.85 as baseline, then 30% markup and KSh50 rounding.
begin;
do $pricing$
declare r record; affected integer;
begin
 for r in select * from (values
('pioneer-30g19-hybrid-maize-seed-2kg',1300.00::numeric,950.00::numeric,722.50::numeric),
('pioneer-p2848w-hybrid-maize-seeds-2kg',1235.00::numeric,950.00::numeric,722.50::numeric),
('pioneer-p3812w-hybrid-maize-seeds-2kg',1300.00::numeric,950.00::numeric,722.50::numeric),
('premier-767-25l-2-stroke-petrol-knapsack-sprayer',19500.00::numeric,15450.00::numeric,11899.15::numeric),
('ph-1-maize-seeds-2kg',699.00::numeric,700.00::numeric,552.50::numeric),
('promax-20ec-insecticide-1-litre',4350.00::numeric,6650.00::numeric,5100.00::numeric),
('ramtons-rm-399-1-7l-corded-electric-kettle',3250.00::numeric,1250.00::numeric,959.65::numeric),
('ramtons-rm-458-20l-digital-glass-door-microwave',11350.00::numeric,8850.00::numeric,6799.15::numeric),
('ramtons-rm-553-21l-wet-and-dry-vacuum-cleaner',14299.00::numeric,10500.00::numeric,8074.15::numeric),
('ramtons-rm-580-1-5l-blender-with-mill-500w',8150.00::numeric,5500.00::numeric,4220.25::numeric)
 ) as v(product_id,expected_price,new_price,new_cost)
 loop
  update public.products set price=r.new_price,cost=r.new_cost where id=r.product_id and active=true and price=r.expected_price;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Batch 12 price guard failed for % (expected %, changed %)',r.product_id,r.expected_price,affected; end if;
 end loop;
end
$pricing$;

-- Attach the existing 40g Prequel listing to its new pack family; preserve its slug.
update public.products set variant_group='prequel-720-wp-fungicide',variant_label='40g'
where id='prequel-720-wp-fungicide-40g' and variant_group is null;

-- Missing, verified Premise 200 SC 250ml pack. No image is reused from a different bottle size.
insert into public.products
(id,category_id,name,price,cost,stock,low_at,featured,active,images,description,unit,variant_group,variant_label,slug,seo_name,seo_title,meta_title,meta_description,alt_text,keywords,stock_status)
values
('premise-200-sc-termiticide-250ml',36,'Premise 200 SC Termiticide 250ml',6500,5014.15,1000,20,true,true,'{}',
'Premise 200 SC Termiticide 250ml is a 250 ml pack of the imidacloprid 200 g/L suspension concentrate used for termite protection in buildings, where that use is authorised by the current Kenya-approved label. This listing is for the 250 ml bottle only. Check the product name, formulation, concentration, pack size, batch and expiry details on delivery. The 250 ml presentation is listed by Kenyan suppliers including Agropests, AgriGuard Agrovet, Nunuza and Imagine Care. Use the product only for the crops, sites, pests and application methods specified on the current label. Do not infer application rates from another pack or online listing. Follow label directions for PPE, dilution, application volume, environmental protection, re-entry, storage, first aid and disposal. Keep the original container closed and locked away from children, animals, food and feed. Prevent contamination of wells, drains, streams and ponds. For larger building treatments, use a suitably trained and authorised pest-management professional. Stermont Arcade offers M-Pesa checkout, Nairobi pickup and countrywide delivery; confirm availability and delivery charges at checkout.',
'250ml bottle','premise-200-sc-termiticide','250 ml','premise-200-sc-termiticide-250ml',
'Premise 200 SC Termiticide 250ml','Premise 200 SC Termiticide 250ml Price in Kenya','Premise 200 SC Termiticide 250ml Price in Kenya',
'Buy Premise 200 SC Termiticide 250ml in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Premise 200 SC Termiticide 250ml bottle',
ARRAY['Premise 200 SC 250ml','Premise 200 SC 250ml Kenya','Premise 200 SC price in Kenya','termite treatment chemical Kenya'],
'in_stock'),
('prequel-720-wp-fungicide-120g',71,'Prequel 720 WP Fungicide 120g',350,280.50,1000,20,true,true,'{}',
'Prequel 720 WP Fungicide 120g is the 120 gram pack of the wettable powder fungicide containing mancozeb 600 g/kg and dimethomorph 120 g/kg. Kenyan supplier listings identify this product for use in protective programmes against late blight in potatoes and tomatoes and downy mildew on roses. Confirm the crop, disease, pack, formulation and current PCPB-approved label before purchase or application. Follow the label exactly for preparation, application rate, spray interval, PPE, re-entry and pre-harvest intervals, environmental restrictions and disposal. Do not copy a rate from another formulation or use the product on an unlisted crop. Store the sealed original pack in a secure, dry chemical store away from food, feed, seed, medicines, children and animals. Avoid inhaling powder and wear the PPE stated on the label and safety data sheet. Stermont Arcade provides M-Pesa checkout, Nairobi pickup and countrywide delivery; verify the sealed pack and expiry details on delivery.',
'120g pack','prequel-720-wp-fungicide','120g','prequel-720-wp-fungicide-120g',
'Prequel 720 WP Fungicide 120g','Prequel 720 WP Fungicide 120g Price in Kenya','Prequel 720 WP Fungicide 120g Price in Kenya',
'Buy Prequel 720 WP Fungicide 120g in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Prequel 720 WP Fungicide 120g pack',
ARRAY['Prequel 720 WP 120g','Prequel 720 WP 120g Kenya','Prequel fungicide price Kenya','fungicide for late blight Kenya'],
'in_stock'),
('prequel-720-wp-fungicide-500g',71,'Prequel 720 WP Fungicide 500g',1500,1156,1000,20,true,true,'{}',
'Prequel 720 WP Fungicide 500g is the 500 gram wettable powder pack containing mancozeb 600 g/kg and dimethomorph 120 g/kg. Kenyan supplier listings identify the formulation for protective disease-management programmes against late blight in potatoes and tomatoes and downy mildew on roses. Confirm the current Kenya-approved label, crop, target disease and application method before use. The label is the authority for preparation, dose, spray interval, PPE, re-entry period, pre-harvest interval, environmental restrictions and disposal. Never guess a dose or transfer directions from another formulation. Keep the original sealed pack in a secure, dry and ventilated chemical store, separate from food, feed, seed and medicines. Avoid inhaling dust; use the protective equipment specified by the label and safety data sheet. Keep children and animals away. Stermont Arcade offers M-Pesa checkout, Nairobi pickup and countrywide delivery. Check the seal, label, batch and expiry details on delivery.',
'500g pack','prequel-720-wp-fungicide','500g','prequel-720-wp-fungicide-500g',
'Prequel 720 WP Fungicide 500g','Prequel 720 WP Fungicide 500g Price in Kenya','Prequel 720 WP Fungicide 500g Price in Kenya',
'Buy Prequel 720 WP Fungicide 500g in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Prequel 720 WP Fungicide 500g pack',
ARRAY['Prequel 720 WP 500g','Prequel 720 WP 500g Kenya','Prequel fungicide price Kenya','late blight fungicide Kenya'],
'in_stock'),
('prequel-720-wp-fungicide-1kg',71,'Prequel 720 WP Fungicide 1kg',2950,2256.75,1000,20,true,true,'{}',
'Prequel 720 WP Fungicide 1kg is the 1 kilogram wettable powder pack containing mancozeb 600 g/kg and dimethomorph 120 g/kg. Kenyan supplier listings identify this fungicide for protective programmes against late blight in potatoes and tomatoes and downy mildew on roses. Use only where the current Kenya-approved label authorises the crop, disease and application method. Follow the original label for mixing, application rate, spray interval, protective equipment, re-entry and pre-harvest intervals, environmental precautions and disposal. Do not estimate application rates from pack weight or from another product. Store the unopened pack in its original labelled packaging in a locked, dry chemical store away from food, feed, seed, medicines, children and animals. Avoid inhaling powder and use all label-required PPE. Verify the seal, batch and expiry details on receipt. Stermont Arcade supports M-Pesa checkout, Nairobi pickup and countrywide delivery; confirm delivery charges at checkout.',
'1kg pack','prequel-720-wp-fungicide','1kg','prequel-720-wp-fungicide-1kg',
'Prequel 720 WP Fungicide 1kg','Prequel 720 WP Fungicide 1kg Price in Kenya','Prequel 720 WP Fungicide 1kg Price in Kenya',
'Buy Prequel 720 WP Fungicide 1kg in Kenya. M-Pesa checkout, Nairobi pickup and countrywide delivery.',
'Prequel 720 WP Fungicide 1kg pack',
ARRAY['Prequel 720 WP 1kg','Prequel 720 WP 1kg Kenya','Prequel fungicide price Kenya','late blight fungicide Kenya'],
'in_stock')
on conflict (id) do nothing;
commit;
