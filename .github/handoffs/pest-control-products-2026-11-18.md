# Pest-control product batch — 18 November 2026

## Publication status

Ten pest-control products are active in Supabase, featured, and have one stored product image each. The product-page build completed successfully and its page guard reported that all active products have generated pages. The public product sitemap includes all ten URLs.

Publishing defaults applied:
- Supplier reference cost is stored in `cost`.
- Selling price is exactly 30% above cost.
- Stock quantity: 1,000.
- Low-stock alert: 20.
- Featured: true.
- Active: true.
- SEO title, meta title, meta description, keywords and image alt text populated.
- Product images stored in Supabase Storage bucket `product-images`.

## Published products

| Product | Supplier cost (KES) | Selling price (KES) | Product page |
|---|---:|---:|---|
| Agita 1GB Granular Fly Bait 20g | 300.00 | 390.00 | https://stermontarcade.co.ke/p/agita-1gb-granular-fly-bait-20g.html |
| Chali Dudu 60 Insecticidal Dust 100g | 121.00 | 157.30 | https://stermontarcade.co.ke/p/chali-dudu-60-insecticidal-dust-100g.html |
| Cockrakill Paste Cockroach Bait 100g | 302.00 | 392.60 | https://stermontarcade.co.ke/p/cockrakill-paste-cockroach-bait-100g.html |
| K-Othrine EC 15 Public Health Insecticide 1L | 7,500.00 | 9,750.00 | https://stermontarcade.co.ke/p/k-othrine-ec-15-public-health-insecticide-1l.html |
| Medex 0.05% RB Cockroach Gel Bait 10g | 510.00 | 663.00 | https://stermontarcade.co.ke/p/medex-0-05-rb-cockroach-gel-bait-10g.html |
| Mende Sharp Shooter 0.5GB Cockroach Gel 5g | 799.00 | 1,038.70 | https://stermontarcade.co.ke/p/mende-sharp-shooter-0-5gb-cockroach-gel-5g.html |
| Mos-N-Roach 100EC Insecticide 20ml | 140.00 | 182.00 | https://stermontarcade.co.ke/p/mos-n-roach-100ec-insecticide-20ml.html |
| Mos-N-Roach 100EC Insecticide 100ml | 470.00 | 611.00 | https://stermontarcade.co.ke/p/mos-n-roach-100ec-insecticide-100ml.html |
| Mos-N-Roach 100EC Insecticide 1L | 3,500.00 | 4,550.00 | https://stermontarcade.co.ke/p/mos-n-roach-100ec-insecticide-1l.html |
| Paresol Public Health Mosquito Aerosol 450ml | 880.00 | 1,144.00 | https://stermontarcade.co.ke/p/paresol-public-health-mosquito-aerosol-450ml.html |

## Supplier and regulatory references

- Medex 0.05% RB 10g — Agroduka: https://agroduka.ke/medex-0-05-rb-10-grams/
- Mos-N-Roach 100EC 20ml — Agropests: https://agropests.com/products/mos-n-roach-100ec-20ml
- Mos-N-Roach 100EC 100ml — Agropests: https://agropests.com/products/mos-n-roach-100ec-100ml
- Mos-N-Roach 100EC 1L — Agropests: https://agropests.com/products/mos-n-roach-100-ec-1-l
- K-Othrine EC 15 1L — AgriGuard Agrovet: https://agriguardagrovet.co.ke/product/k-othrine-ec-15/
- Mende Sharp Shooter 5g — Imagine Care listing/category reference: https://imaginecare.co.ke/product-category/cockroach-solutions/
- Cockrakill Paste 100g — Courii reference: https://courii.com/shops/17/categories/727
- Chali Dudu Dust — Agroduka: https://agroduka.ke/chali-dudu-dust/
- Paresol Aerosol 450ml — Agroduka: https://agroduka.ke/paresol-450ml/
- Agita 1GB Fly Bait 20g — Agroduka: https://agroduka.ke/agita-1gb-fly-bait/
- PCPB public-health register: https://www.pcpb.go.ke/public-health/

## Important content and photo notes

- Product descriptions avoid inventing pesticide dilution rates; the original product label remains authoritative.
- PCPB identifies K-Othrine EC 15 (deltamethrin 15g/L, PCPB(CR)0832) for public-health use against house flies. Its description was corrected to distinguish it from K-Othrine WG 250.
- PCPB identifies Mos-N-Roach 100EC as alpha-cypermethrin 100g/L, PCPB(CR)0779-p(i), for public-health mosquito control.
- PCPB identifies Agita 1GB (PCPB(CR)0370) for housefly control; registered actives are thiamethoxam 10g/kg and cis-9-tricosene 1g/kg.
- The Agita 20g image is an exact Agita 1GB 20g sachet reference from an overseas Elanco retail image; packaging may differ by market, so buyers should check the delivered Kenyan label.
- Mos-N-Roach supplier pages reuse a common product image across pack variants; the product titles and descriptions specify the exact 20ml, 100ml and 1L sizes.
- Pygrease 500g was left inactive as a draft because the page-image fetch produced the same image bytes as Paresol, so it was not considered safe to publish with an unverified/mismatched photo. Agita 1GB 20g was used as the tenth active listing instead.

## Build and deployment

- Source repository: https://github.com/stermontmall/stermontmall.github.io
- Product build run: https://github.com/stermontmall/stermontmall.github.io/actions/runs/44360210254
- GitHub Pages deployment run: https://github.com/stermontmall/stermontmall.github.io/actions/runs/44360209474
- Product catalogue SEO guard checked 1,715 active products and passed.
- Product page guard passed: all 1,715 active products had a generated page.
- The generated `sitemap-products.xml` includes all ten product URLs above.
- Google indexing is separate from successful page generation and deployment; indexing is not guaranteed immediately.
