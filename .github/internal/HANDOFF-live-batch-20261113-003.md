# Stermont Arcade — live product batch note
## 2026-11-13 — Pest-control equipment continuation (28 of 50 verified in Supabase)

Three new, distinct products were created in category 38 (Sprayers & Equipment) using the batch-specific 30% markup helper. Each has an original description exceeding 600 words, stock=1000, low_at=20, featured=false, active=true, and one product-specific image stored in the public `product-images` bucket. Each photo upload request returned HTTP 200 with `ok:true` and `live:true`; the database/storage join confirms one object per product. MIME types are JPEG, WebP and PNG respectively.

| Product | Supplier reference price / cost (KSh) | Stored Stermont price (KSh) | Description words |
|---|---:|---:|---:|
| Jacto PJM 25L Motorised Knapsack Sprayer with Honda 4-Stroke Engine | 76,887 | 99,999 | 859 |
| Jacto SB-20 20L Lithium Battery Backpack Sprayer | 41,592 | 54,099 | 856 |
| Osho Deluxe Bucket Sprayer – Manual Brass Stirrup Pump | 9,366 | 12,199 | 948 |

### Product links
- https://stermontarcade.co.ke/?product=jacto-pjm-25l-motorised-knapsack-sprayer-with-honda-4-stroke-engine
- https://stermontarcade.co.ke/?product=jacto-sb-20-20l-lithium-battery-backpack-sprayer
- https://stermontarcade.co.ke/?product=osho-deluxe-bucket-sprayer-manual-brass-stirrup-pump

### Supplier/image sources and qualifications
- Jacto PJM: Osho Chemical Industries product listing, KSh 76,887. Product description notes supplier inconsistency: short description says five-gallon capacity while detailed description says 25L; listing also displays 16L/20L option metadata. Product description flags that buyer should confirm exact tank capacity/variant before purchase. Matching Jacto PJM image from Jacto's product-image CDN.
- Jacto SB-20: Osho Chemical Industries listing, KSh 41,592. Matching Jacto SB-20 image from a product listing.
- Osho Deluxe Bucket Sprayer: Osho Chemical Industries official listing, KSh 9,366. Matching Deluxe Bucket Sprayer image from Agroduka.
- Jacto PJB and Osho Hillor HR14 were not published in this batch: the PJB's local supplier listings show materially different prices/capacity variants that need reconciliation; the HR14 image could not be confidently matched to the exact model. Do not count them as live or create links yet.
- Site price-point trigger rounds some calculated 30% prices upward. Do not disable or bypass the trigger.
- Static product page rebuild and sitemap update have not been verified. Supabase activation and Storage uploads are confirmed; do not claim static page refresh until the GitHub product-pages workflow and generated pages are checked.

### Next
Continue from 28/50. Catalogue-wide duplicate checks, exact KES supplier price, matching product image, 600+ word unique SEO description, 30% markup, stock=1000, low_at=20, and photo-before-activation verification remain mandatory.
