# Stermont Arcade — 2026-11-14 product batch addendum

## Markup rule
The owner's latest instruction is 30% markup. This supersedes earlier 15% workflow notes for all future listings. New listings in this continuation explicitly called the seven-argument `public.add_draft_product(..., p_markup_pct => 30)` overload. The database price-rounding trigger may round the final public price to its preferred price point, so record the stored price exactly rather than assume it equals the raw 30% result.

## Three new live products
All three products passed duplicate-name/model checks, were created inactive, had their exact model images extracted from official Oraimo Kenya product pages through `public.add_product_photo`, returned upload HTTP 200, then passed `public.activate_product_if_photo_ok`. Final Supabase row check confirmed active=true, one image URL, stock=1000, low_at=20, featured=false, SEO title and original long description. All three appear in `public.get_store_catalog()`.

| Product | Slug | Source retail reference | Cost entered | Raw +30% | Stored website price | Description |
|---|---|---:|---:|---:|---:|---:|
| Oraimo SmartBlender Go 500ML Portable Blender OH-PB1N | `oraimo-smartblender-go-500ml-portable-blender-oh-pb1n` | Jumia Oraimo Official Store KSh2,600 | 2,600 | 3,380 | 3,399 | 5,661 chars |
| Oraimo ThermoGo 750ml Stainless Steel Insulated Thermos OH-VIT201N | `oraimo-thermogo-750ml-stainless-steel-insulated-thermos-oh-vit201n` | Jumia Oraimo Official Store KSh1,700 | 1,700 | 2,210 | 2,250 | 5,523 chars |
| Oraimo Slice Link OPB-P5101 10000mAh 12W Power Bank | `oraimo-slice-link-opb-p5101-10000mah-12w-power-bank` | Jumia Oraimo Official Store KSh1,699 | 1,699 | 2,208.70 | 2,250 | 5,668 chars |

### Product pages
- https://stermontarcade.co.ke/?product=oraimo-smartblender-go-500ml-portable-blender-oh-pb1n
- https://stermontarcade.co.ke/?product=oraimo-thermogo-750ml-stainless-steel-insulated-thermos-oh-vit201n
- https://stermontarcade.co.ke/?product=oraimo-slice-link-opb-p5101-10000mah-12w-power-bank

### Photo object URLs
- https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/oraimo-smartblender-go-500ml-portable-blender-oh-pb1n.webp
- https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/oraimo-thermogo-750ml-stainless-steel-insulated-thermos-oh-vit201n.webp
- https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/oraimo-slice-link-opb-p5101-10000mah-12w-power-bank.webp

### Research sources
- Jumia Oraimo Official Store (Kenyan retail prices and review counts): https://www.jumia.co.ke/mlp-oraimo-official-store/
- Oraimo Kenya SmartBlender Go official page: https://ke.oraimo.com/product/oraimo-500ml-4000mah-battery-powerful-motors-tritan-plastic-portable-blender
- Oraimo Kenya ThermoGo official page: https://ke.oraimo.com/product/oraimo-vacuum-thermos-cup
- Oraimo Kenya Slice Link official page: https://ke.oraimo.com/product/oraimo-slice-link-10000mah-12w-fast-charge-3-in-1-portable-power-bank-with-built-in-lightning-type-c-micro-usb-cable

### Progress
Three newly published listings in this continuation; 3/20 of the requested batch are complete. No other products are counted. The source values are Kenyan retail references used as cost inputs, not confirmed wholesale acquisition costs. Do not treat gross markup as net profit until actual procurement, shipping, fees and taxes are accounted for. The site's price trigger rounds prices upward to supported price points.

## Pest-control products published in this continuation
Four existing inactive product drafts were checked against the catalogue and source listings, then activated through `public.activate_product_if_photo_ok`. All four now have active=true and are present in `public.get_store_catalog()` with image, price and stock values.

| Product | Slug | Source | Cost basis | Stored website price | Image / description |
|---|---|---|---:|---:|---|
| Magnetic Mosquito-Proof Screen Door Curtain 210 x 100 cm | `magnetic-mosquito-proof-screen-door-curtain-210-x-100-cm` | Jumia Kenya listing, KSh920 at time of research; listed polyester, 210 x 100 cm | KSh800 existing cost basis | KSh1,050 | Uploaded successfully (HTTP 200) from a matching 210 x 100 cm product image; description 3,767 chars |
| PB 16 Sprayer Spare Parts Lock Nut TE/2AC | `pb-16-sprayer-spare-parts-lock-nut-te-2ac` | Agroduka Kenya listing | KSh143 | KSh199 | Existing stored image; description 823 chars |
| PB 16 Sprayer Spare Parts PI Strainer for Chamber 322(pi) | `pb-16-sprayer-spare-parts-pi-strainer-for-chamber-322-pi` | Agroduka Kenya listing | KSh344 | KSh450 | Existing stored image; description 928 chars |
| PB 16 Sprayer Spare Parts Suction Valve CPT 312 | `pb-16-sprayer-spare-parts-suction-valve-cpt-312` | Agroduka Kenya listing | KSh358 | KSh499 | Existing stored image; description 898 chars |

### Live product pages
- https://stermontarcade.co.ke/?product=magnetic-mosquito-proof-screen-door-curtain-210-x-100-cm
- https://stermontarcade.co.ke/?product=pb-16-sprayer-spare-parts-lock-nut-te-2ac
- https://stermontarcade.co.ke/?product=pb-16-sprayer-spare-parts-pi-strainer-for-chamber-322-pi
- https://stermontarcade.co.ke/?product=pb-16-sprayer-spare-parts-suction-valve-cpt-312

### Source references
- Jumia exact 210 x 100 cm magnetic door screen listing: https://www.jumia.co.ke/generic-magnetic-mosquito-proof-screen-door-curtain-size210x100cm-325559978.html
- Agroduka sprayer listings, including PB 16 lock nut and suction valve: https://agroduka.ke/sprayers/
- Agroduka PB 16 PI strainer listing: https://agroduka.ke/agrichem-africa-ltd/?currency=KES&items_per_page=24&layout=short_list&sort_by=product&sort_order=desc
- PB-16/PB-20 parts guide: https://irp.cdn-website.com/ab519157/files/uploaded/2021_07_19%20PB%20Maintainance%20Guide.pdf

The four products above are separate from the three Oraimo listings recorded earlier in this file. Pest-control additions: 4 newly activated listings. The magnetic screen image upload succeeded with HTTP 200; the attempted Jumia page-image extraction returned HTTP 403 and was not used. The final image is a matching 210 x 100 cm magnetic mosquito screen sourced from another product listing; keep product details conservative and verify actual supplied colour/fasteners before fulfilment.
