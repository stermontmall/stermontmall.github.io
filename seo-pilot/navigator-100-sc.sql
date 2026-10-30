-- Navigator 100 SC (1 Litre): new product name, page title and description.
-- Paste into Supabase > SQL Editor > Run. The old text is already saved in description_backup (batch 'pilot-01-navigator').
update public.products set
 seo_name = 'Navigator 100 SC Insecticide 1 Litre – Roaches & Bed Bugs',
 seo_title = 'Navigator 100 SC Insecticide 1L in Kenya | Stermont Arcade',
 description = $d$Navigator 100 SC Insecticide (1 Litre)

Navigator 100 SC is a public health insecticide with alpha-cypermethrin 100 g/L that controls cockroaches and bed bugs and works as a residual indoor spray against mosquitoes. One treated surface keeps working after it dries, which makes it a practical choice for homes, hotels, hostels, schools and pest control operators who want results that last beyond the day of spraying.

KEY FEATURES & BENEFITS
• Alpha-cypermethrin 100 g/L: a pyrethroid that works on contact
• Leaves a residual film, so insects that walk across or rest on treated surfaces are still affected
• Controls cockroaches and bed bugs, and treats indoor surfaces against mosquitoes
• Suspension concentrate: mixes with water and is used for crack, crevice and surface treatments
• 1 litre pack for repeat jobs in larger homes, hostels, hotels and institutions
• Pay by M-Pesa and get delivery to all 47 counties

TECHNICAL SPECIFICATIONS
• Brand: Navigator
• Product: Navigator 100 SC Insecticide
• Active ingredient: Alpha-cypermethrin 100 g/L
• Formulation: Suspension concentrate (SC)
• Targets: Cockroaches, bed bugs, mosquitoes
• Pack size: 1 Litre
• Category: Pest control and fumigation
• Dilution rate and coverage per litre: see the product label (they differ by pest and surface)

HOW TO USE
1. Clean and declutter first. Remove food, cover utensils and fish tanks, and move people and pets out.
2. Wash bedding and vacuum mattresses, floors and corners before treating bed bugs.
3. Read the label and measure the dilution for your target pest. Do not guess the rate.
4. Mix in clean water in a sprayer, shaking or stirring well, because this is a suspension concentrate.
5. Spray cracks, crevices, bed frames, mattress seams, skirting boards and the places cockroaches hide: behind cookers and fridges, under sinks and along drains.
6. For mosquitoes, treat the indoor resting surfaces as directed on the label.
7. Keep people and pets out until the surfaces are dry, then ventilate the room.
8. Repeat treatment if the label advises it. Bed bugs often need a second visit. For heavy infestations or large buildings, use a licensed pest control operator.

WHAT'S IN THE BOX
• 1 x Navigator 100 SC Insecticide, 1 Litre bottle

SAFETY & STORAGE
Check the PCPB registration number on the label and read the label before use. Keep locked out of reach of children. Wear gloves, a mask and protective clothing when mixing and spraying. Do not contaminate water sources, and do not pour leftover mixture into drains. Store in the original closed bottle in a cool, dry, locked place.

ORDER
Pay by M-Pesa. Delivery to all 47 counties, or pick up at The Sarit Centre, Westlands, Nairobi. Questions? WhatsApp +254 748 888 230.$d$
where id = 'navigator-100-sc-insecticide-1-litre'
returning id, seo_name, seo_title, length(description) as description_chars;
