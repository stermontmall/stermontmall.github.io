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