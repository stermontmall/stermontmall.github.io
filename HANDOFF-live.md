## 2026-11-18 — Pricing source refinements
- Updated exact retail baselines to the lowest currently visible reputable Nairobi retail listings where available:
  - Air Chopper 7.5% SC 30ml: Imagine Care KSh 999 (baseline KSh 849.15; final KSh 1,100).
  - Air Chopper 7.5% SC 100ml: Imagine Care KSh 1,499 (baseline KSh 1,274.15; final KSh 1,650).
  - Air Chopper 7.5% SC 15ml three-pack: Imagine Care KSh 799 (baseline KSh 679.15; final KSh 900).
  - Hafeton 100 SC 100ml: Imagine Care KSh 999 (baseline KSh 849.15; final KSh 1,100); PCPB public-health registration remains unconfirmed.
  - Sevin Dudu Dust 200g: Naivas Online KSh 160 (baseline KSh 136; final KSh 200).
- The database cost and final retail values, and the matching product-description price calculations, were updated to these references. The 20-row price audit was rerun after the updates.

---

## 2026-11-18 — PCPB register verification correction
- Rechecked the current official PCPB public-health register: https://www.pcpb.go.ke/public-health/ . It confirms the current entries for SCUD 5% WP (PCPB(CR)1808), NAVIGATOR 100 SC (PCPB(CR)1268), KILEX 0.5 GEL (PCPB(CR)2393), AIR CHOPPER 7.5% SC (PCPB(CR)1648), HYGIENIC 7.5% SC (PCPB(CR)1648-P(i)), MENDE MO FIRE (PCPB(CR)1810), PUNISHER 8.5% TA (PCPB(CR)1774), OSEFIN 7.5 WP (PCPB(CR)1394), SEVIN DUDU DUST (PCPB(CR)0828), and DRAGON 5% WP (PCPB(CR)1807).
- A matching HAFETON 100 SC entry and a matching PARETO ROACH SPRAY entry were **not located** in the current public-health register during this check. Previous registration numbers recorded for those two products are unverified and have been removed from the ledger. Keep both products inactive until PCPB confirms their current registration and permitted public-health uses.
- SCUD concentration discrepancy: retailer listing says deltamethrin 50 g/kg, while the current PCPB register displays 50 g/L. The physical Kenyan label must resolve this before activation or use. Both SCUD pack descriptions now flag the discrepancy.
- These checks do not establish that a product is unregistered in every PCPB category; they establish only that a matching entry was not found in the current public-health list searched.

---

## 2026-11-18 — Fumigation Chemicals batch 20: 20 complete draft records

### Final batch result
- Category: `Fumigation Chemicals`, category_id `37`.
- Created **20 new product records**. Category now has **33 total products: 13 existing live products + 20 new inactive drafts**.
- No existing product was edited. No Syngenta product was added or repriced.
- Every new record has `stock=1000`, `low_at=20`, `active=false`, a unique pack-specific name/unit, an original description over 800 words, SEO title, meta description, keywords and alt text.
- All 20 baseline costs were verified from an exact-pack Kenyan retail listing and set to 85% of that retail price. All baselines fall below KSh 20,000, so the +30% tier applies. Final prices were rounded to the nearest KSh 50 and checked against the KSh 200 floor and 15% minimum margin floor.
- Final Supabase audit passed: 20/20 in category 37; correct stock defaults; all inactive; all descriptions >=800 words; SEO title <=60 characters; meta description <=155 characters; every price meets the margin floor, KSh 200 floor, nearest-KSh-50 rounding and the applicable 30% tier calculation.
- **Images:** 12 product image uploads succeeded and 8 could not be fetched. The upload function checks/downloads image bytes and stores them; it does **not** verify that the photo depicts the exact product/pack. No visual exact-pack QA was available, so all 20 remain inactive. Do not activate solely because the upload endpoint returned `ok:true`.
- Before activation, visually check all 12 stored images against the exact pack size and label; replace or attach exact images for the 8 missing-photo SKUs; refresh source prices/availability; confirm the physical Kenyan label and PCPB use restrictions.

### Product and pricing ledger
Retail source prices below are KSh. Baseline = retail x 0.85. Final price = baseline x 1.30, rounded to nearest KSh 50 and then floored at KSh 200.

| Product / exact pack | Retail source (KES) | Baseline cost | Final price | PCPB register | Image |
|---|---:|---:|---:|---|---|
| SCUD 5 WP 20g | 899 | 764.15 | 1,000 | PCPB(CR)1808 | Uploaded; visual QA pending |
| Navigator 100SC 20ml | 200 | 170.00 | 200 | PCPB(CR)1268 | Uploaded; visual QA pending |
| Hygienic 7.5% SC 100ml | 480 | 408.00 | 550 | PCPB(CR)1648-P(i) | Uploaded; visual QA pending |
| Air Chopper 7.5% SC 15ml | 150 | 127.50 | 200 | PCPB(CR)1648 | Uploaded; visual QA pending |
| Kilex 0.5 Gel 5g | 800 | 680.00 | 900 | PCPB(CR)2393 | Not uploaded (Jiji/Jumia HTTP 403) |
| Mende Mo Fire 5g | 99 | 84.15 | 200 | PCPB(CR)1810 | Uploaded; visual QA pending |
| Punisher 8.5% TA 20g | 270 | 229.50 | 300 | PCPB(CR)1774 | Uploaded; visual QA pending |
| Hafeton 100 SC 100ml | 999 | 849.15 | 1,100 | PCPB status unconfirmed in current PCPB public-health register | Not uploaded (Jumia HTTP 403) |
| Punisher 8.5% TA 500g | 5,775 | 4,908.75 | 6,400 | PCPB(CR)1774 | Uploaded; visual QA pending |
| SCUD 5 WP 100g | 1,699 | 1,444.15 | 1,900 | PCPB(CR)1808 | Uploaded; visual QA pending |
| Air Chopper 7.5% SC 30ml | 999 | 849.15 | 1,100 | PCPB(CR)1648 | Uploaded; visual QA pending |
| Air Chopper 7.5% SC 100ml | 1,499 | 1,274.15 | 1,650 | PCPB(CR)1648 | Not uploaded (Jumia HTTP 403) |
| Hafeton 100 SC 1L | 5,999 | 5,099.15 | 6,650 | PCPB status unconfirmed in current PCPB public-health register | Uploaded; visual QA pending |
| Mende Mo Fire 250g | 2,505 | 2,129.25 | 2,750 | PCPB(CR)1810 | Uploaded; visual QA pending |
| Air Chopper 7.5% SC 15ml 3-pack | 799 | 679.15 | 900 | PCPB(CR)1648 | Not uploaded (Jumia HTTP 403) |
| Hygienic 7.5% SC 20ml | 999 | 849.15 | 1,100 | PCPB(CR)1648-P(i) | Not uploaded (Jumia HTTP 403) |
| Osefin 7.5 WP 200g | 699 | 594.15 | 750 | PCPB(CR)1394 | Not uploaded (Imagine Care HTTP 403) |
| Sevin Dudu Dust 200g | 160 | 136.00 | 200 | PCPB(CR)0828 | Uploaded; visual QA pending |
| Osefin 7.5 WP 100g | 499 | 424.15 | 550 | PCPB(CR)1394 | Not uploaded (Imagine Care HTTP 403) |
| Pareto Roach Spray 1L | 1,310 | 1,113.50 | 1,450 | PCPB status unconfirmed in current PCPB public-health register | Not uploaded (marketplace timeout; refresh price before activation) |

### Supplier price source URLs
- SCUD 5 WP 20g — Cheapthings: https://cheapthings.co.ke/product/scud-5-wp-20g/
- Navigator 100SC 20ml — Agropests: https://agropests.com/products/navigator-100sc-20ml
- Hygienic 7.5% SC 100ml — Agropests: https://agropests.com/products/hygienic-75percent-sc-100ml
- Air Chopper 7.5% SC 15ml — AgriGuard: https://agriguardagrovet.co.ke/product/air-chopper-7-5-sc/
- Kilex 0.5 Gel 5g — AECARE Agrochemicals Jiji listing: https://jiji.co.ke/nairobi-central/household-chemicals/kilex-0-5-cockroach-gel-insecticide-5-grams-uPEdUCz5kxXEpHNk2nA0Y86R.html
- Mende Mo Fire 5g — Jumia: https://www.jumia.co.ke/generic-mende-mo-fire-5g-250719335.html
- Punisher 8.5% TA 20g and 500g — Farm Rescue: https://www.farmrescue.co.ke/product/punisher-85-ta-tablet
- Hafeton 100 SC 100ml — Imagine Care listing: https://imaginecare.co.ke/product-tag/pests/
- SCUD 5 WP 100g — Cheapthings: https://cheapthings.co.ke/product/scud-5-wp-100g/
- Air Chopper 7.5% SC 30ml — Imagine Care: https://imaginecare.co.ke/pest-control/flea-control/
- Air Chopper 7.5% SC 100ml and 15ml three-pack — Imagine Care: https://imaginecare.co.ke/product-category/bed-bug-solutions/
- Hafeton 100 SC 1L — Cheapthings: https://cheapthings.co.ke/product/hafeton-100-sc-1l/
- Mende Mo Fire 250g — Kilimall: https://www.kilimall.co.ke/listing/1001224794-Mende-Mo-Fire-250g
- Hygienic 7.5% SC 20ml — Jumia: https://www.jumia.co.ke/generic-hygienic-7.5-sc-20ml-315503845.html
- Osefin 7.5 WP 100g and 200g — Imagine Care listing: https://imaginecare.co.ke/shop/page/17/?product-page=lesawkbcl&product_count=60&product_orderby=popularity&product_view=list
- Sevin Dudu Dust 200g — Naivas Online: https://www.naivas.online/sevin-dudu-dust-200g
- Pareto Roach Spray 1L — Kilimo Buz / PPCK listing: https://asdspmarketinfo.kilimo.go.ke/product-detail/441 (exact 1L price shown; listing is older, refresh before activation)

### Stored image URLs (upload succeeded; not yet visually verified)
- Air Chopper 7.5% SC 15ml: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/air-chopper-7-5-sc-15ml.jpg
- Air Chopper 7.5% SC 30ml: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/air-chopper-7-5-sc-30ml.png
- Hafeton 100 SC 1L: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/hafeton-100-sc-1l.png
- Hygienic 7.5% SC 100ml: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/hygienic-7-5-sc-100ml.png
- Mende Mo Fire 250g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/mende-mo-fire-250g.webp
- Mende Mo Fire 5g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/mende-mo-fire-5g.png
- Navigator 100SC 20ml: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/navigator-100sc-20ml.png
- Punisher 8.5% TA 20g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/punisher-8-5-ta-20g.jpg
- Punisher 8.5% TA 500g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/punisher-8-5-ta-500g.jpg
- SCUD 5 WP 100g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/scud-5-wp-100g.png
- SCUD 5 WP 20g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/scud-5-wp-20g.png
- Sevin Dudu Dust 200g: https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/sevin-dudu-dust-200g.jpg

### Remaining first-five candidate
- DRAGON 5 WP: PCPB(CR)1807 appears in the public-health register and Osho confirms 20g and 100g packs, but its official product page still gives a combined KSh 102–475 range. No exact pack-specific price was found from a reliable current Kenyan listing. No Dragon product was created and no price was inferred. Resume by finding an exact 20g or 100g price; keep this outside the completed 20 until verified.

### Next actions
1. Manually verify the 12 stored images against the exact pack size and visible label; do not activate based on HTTP 200 alone.
2. Find direct image URLs or alternative suppliers for the 8 missing-photo products.
3. Refresh Pareto 1L price and all other supplier stock/price checks before any activation.
4. Verify the physical product label and PCPB registration/use for each pack, especially exact pack and site restrictions.
5. Activate only after the exact pack photo and regulatory checks pass.

---

## 2026-11-18 — Fumigation Chemicals batch 20 (owner-approved draft fallback)
### Execution rule for this batch
- Do not abort the full run because one candidate has a price range or an unverified image. Continue to the next candidate. Create a product only after an exact pack-size KES price is evidenced. If exact pack price is unresolved, record the candidate as blocked and continue; never infer a price from the range endpoints.
- For every exact-price item, create the full 800+ word unique product guide and Supabase record with the four-tier baseline pricing, stock=1000 and low_at=20. If the exact-pack image is not verified, keep active=false and log the product here. Only activate after exact packshot QA and PCPB registration/use checks. The upload function verifies file bytes, not product identity.
- No Syngenta items. Do not alter existing products.
### Created drafts — category_id 37
- `scud-5-wp-20g`: source listing KSh 899, Cheapthings (Mfangano Street, Nairobi), https://cheapthings.co.ke/product/scud-5-wp-20g/. Retail-only baseline = 899 * 0.85 = KSh 764.15; 30% tier; final price KSh 1,000 (nearest KSh 50). Description 1,386 words. Stock 1,000; low_at 20; active=false. Photo uploader accepted the exact supplier product page and stored https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/scud-5-wp-20g.png; final visual exact-pack QA pending. PCPB public-health register shows SCUD 5% WP PCPB(CR)1808; verify label/pack before activation.
- `navigator-100sc-20ml`: source listing KSh 200, Agropests, Mang Building, Haile Selassie Ave, Nairobi, https://agropests.com/products/navigator-100sc-20ml. Retail-only baseline = 200 * 0.85 = KSh 170; 30% tier; pre-round KSh 221; final price KSh 200 after nearest-KSh-50 rounding and KSh 200 floor. Description 1,299 words. Stock 1,000; low_at 20; active=false. Photo uploader accepted the exact supplier product page and stored https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/navigator-100sc-20ml.png; final visual exact-pack QA pending. PCPB public-health register shows NAVIGATOR 100 SC PCPB(CR)1268; verify label/pack before activation. Do not publish a mixing rate: retailer pages conflict.
### Initial candidates not yet created
- DRAGON 5 WP: Osho official page confirms 20g and 100g packs but shows only KSh 102–475 combined range; exact pack price not established. PCPB register shows PCPB(CR)1807. Continue searching pack-specific price; do not estimate.
- KILEX 0.5 GEL: Osho official page confirms 5g and 30g but shows KSh 278–946 combined range. Jumia 5g listing found at KSh 900 but marked out of stock. PCPB register shows PCPB(CR)2393. Continue searching for an exact in-stock pack price.
- PARETO ROACH SPRAY: PPCK confirms 125ml, 250ml, 500ml and 1L; exact 1L KSh 1,310 found on Kilimo Buz but listing is stale (crawled ~4 months ago). PPCK official page still displays only a combined KSh 200–1,310 range. Find a current exact pack price before creating.
### Progress
- Two draft product rows created; two exact-pack product-page photo uploads succeeded at HTTP 200, but visual packshot inspection and PCPB label confirmation are still pending. No product activated or published. No existing product modified.
- Continue with exact-price, current, non-Syngenta candidates until 20 unique pack listings are saved; log each SKU, baseline, final price, supplier URL, image status and regulatory status here.

---

# Live handoff — technical SEO

Date: 2026-11-15 (Africa/Nairobi)
Repository: stermontmall/stermontmall.github.io
Working branch: wip/seo-batch2-2026-11-15

## 2026-11-18 (queue + PCPB HOLD) — SESSION STATE (newest; supersedes the entries below where they differ)
### PCPB HOLD — DO NOT ACTIVATE these 8 products without PCPB verification
They are all `active=false` today. Keep them that way until the current PCPB registration status and the registered crop use are confirmed (PCPB register or PCPB directly), and the label photo is checked.
- `xpand-max-92-sg-insecticide-100g` — ACEPHATE 92%. Acephate was listed as WITHDRAWN from the Kenyan market in the 2025 Ministry/PCPB pesticide review. Do not sell unless PCPB confirms it is currently registered.
- `pyrinex-chlorpyrifos-insecticide-250ml` — CHLORPYRIFOS. Restricted to use as a termiticide; do not market as a crop insecticide.
- `metro-imidacloprid-insecticide-25ml` and `confidor-wg-70-insecticide-15g` — IMIDACLOPRID. Restricted to non-open-field use.
- `2-4-d-hai-amine-herbicide-20l` — 2,4-D AMINE. Restricted: not for use in coffee (keep that exclusion in the description).
- `agrithane-mancozeb-fungicide-100g`, `dithane-mancozeb-fungicide-500g`, `riomax-72wp-fungicide-2-5kg` — MANCOZEB. Reviewed, decision was pending in the 2025 report; check the current status.
- Evidence limit: this comes from a HapaKenya news report dated 2025-06-23 (hapakenya.com/2025/06/23/kenya-bans-77-harmful-pesticides-restricts-202-halts-imports-of-151-others-pending-assessment), not from the PCPB register. A decision on 151 products under review was expected by December 2025, so statuses may have changed. Also confirm every pesticide label shows a PCPB(CR) registration number. The 26 agrochemicals whose active ingredient is "not stated" in our data cannot be screened until the label is read. Do not bulk-activate agrochemicals.
- Details and the same list: `docs/packshot-checklist-2026-11-18.md` (HOLD section) and `docs/photo-upload-queue-2026-11-18.md`.
### Lumnia confirmed
- Re-queried Supabase 2026-11-18: the three Lumnia 10-pack glueboards (`rentokil-lumnia-compact-white-glueboard-10pack`, `rentokil-lumnia-slim-black-glueboard-10pack`, `rentokil-lumnia-slim-white-glueboard-10pack`) have `category_id = 90` (Insect Light Traps & UV Lamps), `active=false`, 0 images. They are #1-3 in the upload queue.
### Photo-upload queue (owner uploads on phone via `/admin.html`)
- `docs/photo-upload-queue-2026-11-18.md` is the authoritative order and supersedes the "Suggested upload order" in the packshot checklist: Tier 0 Lumnia (3) -> Tier 1 pest control and pest-proofing (11) -> Tier 2 the 33 unflagged agrochemicals (grouped) -> Tier 3 other farm/agrovet (11) -> Tier 4 general (8) -> 8 HOLD items last and only after PCPB verification. Tier order is a judgment, not sales data.
- Still true: nothing has been uploaded, attached or activated; no image has been visually checked by Claude. Activate each product only after a person has looked at the stored image.
### Email check
- Re-queried 2026-11-18: no order newer than STM-JJ6WZ2; `email_log` unchanged (ids 7-9). Owner is about to place a test order and will send the STM-XXXXXX reference. Then run the two queries in the 00:50 entry below.

## 2026-11-18 (later session) — SESSION STATE (supersedes the entries below where they differ)
### Test order / email check — still NOT VERIFIED
- Queried live Supabase (DB clock 2026-11-17 21:43Z = 00:43 EAT 2026-11-18). No order newer than STM-JJ6WZ2 (paid, 2026-11-17 09:56Z) and STM-GY2KML (declined, 09:47Z). Newest `email_log` rows are still ids 7-9 (STM-JJ6WZ2: packed, out_for_delivery, delivered; request_ids 2775-2777).
- `net._http_response` latest rows 2774-2779 all status 200, but all are from 10:47Z-16:20Z, i.e. BEFORE the lockdown migration (21:32Z). Rows 2778-2779 (16:19-16:20Z) have no matching `email_log` row. So there is no post-lockdown evidence either way; the trigger path has not been exercised since the revoke.
- Next: owner places one test order and gives the STM-XXXXXX reference, then run the two queries in the 00:50 entry below (expect a "received" row and status 200).
### Rentokil Lumnia category — FIXED
- The three Lumnia 10-pack glueboards that had `category_id` NULL (compact-white `304857`, slim-black `305057`, slim-white `305056`) were set to `category_id = 90` (Insect Light Traps & UV Lamps) on 2026-11-18, the same category the two live Lumnia Compact Black board products already use. Verified by the UPDATE's RETURNING rows: category_id 90, active false, 0 images.
- Still inactive with no photo. Activate only after a photo is stored and looked at.
### Packshot checklist
- Full grouped list of the 3 Lumnia boards + 41 agrochemicals (26 insecticides, 10 fungicides, 5 herbicides) with slugs, pack sizes and active ingredients: `docs/packshot-checklist-2026-11-18.md`.
- Active ingredient is filled only where our own descriptions state it; 26 of the 44 say "not stated" and must be read from the label/PCPB register.
- No packshot source was verified and no image was seen, uploaded or attached. Lumnia source leads (PestFix UK compact-board page) are leads only.
- Priority: (1) the 3 Lumnia boards, (2) brand clusters Dudufix, Alpha, Dithane/Agrithane, (3) the rest of the agrochemicals, (4) the other 30 imageless products listed in the 00:50 entry.

## 2026-11-18 00:50 (Africa/Nairobi) — SESSION STATE (supersedes the entries below)
### Done and verified
- PR #868 merged 00:30. The SQL was NOT in effect after the owner ran it in the SQL Editor (verified: ACL still had PUBLIC/anon/authenticated), so it was applied as Supabase migration `security_revoke_send_email_public` at 21:32:08Z (00:32 EAT); it is recorded in `supabase_migrations`.
- Verified green after applying: `proacl` of `public.stm_send_email(text,text,text,text,text,text)` is `{postgres=X/postgres,service_role=X/postgres}`; `has_function_privilege` false for anon and authenticated, true for service_role and postgres; no PUBLIC grant; Security Advisor anon-executable count 8 -> 7 and authenticated-executable 13 -> 12 (stm_send_email gone from both). Remaining advisor items are intentional/public by design (`check_voucher`, `track_order`, `rate_order_*`, `recent_purchases`, `is_staff`), staff-gated RPCs, `stm_order_email_trg` (left alone, order function), `stm_hx` search path, `pg_net` in public, and dashboard-only "Leaked password protection" off.
### Test order — NOT VERIFIED yet
- Owner said they placed a test order at ~00:33 EAT (21:33Z). Nothing reached the database: newest `orders` rows are STM-JJ6WZ2 (paid/delivered, 2026-11-17 09:56Z) and STM-GY2KML (declined, 09:47Z); newest `email_log` rows are ids 7-9 for STM-JJ6WZ2 (12:20-12:46Z); Supabase edge logs 18:00-21:35Z show no POST to `/rest/v1/orders`, `paystack-*` or `payments-in`. No evidence the revoke broke anything (no errors in postgres logs apart from the migration itself), but the order flow was not exercised.
- Note: `email_log.status_code` is null for existing rows; the real delivery status is `net._http_response` (rows 2775-2777 returned 200).
- Next: owner re-places the order and gives the order reference (STM-XXXXXX) shown on screen. Then run: `select id, created_at, order_ref, kind, request_id from email_log where order_ref = '<ref>' order by id;` and `select id, status_code, error_msg from net._http_response where id in (<request_ids>);`. Expect a "received" row and status 200. If an order is placed but no email row appears, check postgres logs for `permission denied for function stm_send_email` first and, if found, roll back with `grant execute on function public.stm_send_email(text,text,text,text,text,text) to anon, authenticated;`.
### 74 products with no images — audit done, NO images attached yet
- Facts (2026-11-18): exactly 74 rows in `public.products` have an empty `images` array and ALL 74 are `active=false` (0 active products lack images, so no live product is broken). All have stock above 0 and a cost. Added 2026-11-08 to 2026-11-17.
- By category: Crop Insecticides 26, Fungicides 10, Herbicides 5, Sprayers & Equipment 4, Building & Hardware 4, Protective Wear & Safety 3, Garden & Outdoors 3, Health & Beauty 3, Mosquito & Fly Control 3, NO CATEGORY 3 (the three Rentokil Lumnia 10-pack glueboards: `category_id` is null, fix before publishing), Seeds & Seedlings 2, Fertilizers 2, and 1 each: Agrovet, Phone Accessories, Poultry & Dairy Equipment, Rodent Control, Pest Monitoring & Inspection Tools, Water Tanks & Irrigation.
- Brand clusters worth doing together: Knicker (3), PB 16 sprayer parts (3), Rentokil Lumnia (3), Shabbiri (2), Dudufix (2), Alpha (2), Door-seal strips (4), Mancozeb/Dithane fungicides.
- Regenerate the list any time: `select p.id, p.slug, p.name, c.name category, p.price, p.cost, p.created_at::date from products p left join categories c on c.id = p.category_id where coalesce(array_length(p.images,1),0) = 0 order by c.name, p.name;`
- BLOCKER found this session: the Claude sandbox cannot download from `*.supabase.co`, `stermontmall.github.io` or `agroduka.ke` (proxy 403), and WebFetch cannot show images, so the mandatory visual QA of the final stored image (PUBLISHING.md, 2026-11-13 gate) could not be done. Therefore nothing was uploaded, attached or activated. Do not claim any of the 74 has a photo.
- Safe upload route that never exposes the passcode: from SQL run `select public.add_product_photo('<product-id>', '<exact https image or product-page url>', false, false);` (it reads `upload_settings.photo_passcode` inside the database and calls the `upload-photos` Edge Function; returns a `net` request id). NEVER select from `upload_settings`. Check the result with `select status_code, content from net._http_response where id = <request id>;`, then confirm `products.images`, open the stored public URL and look at it, and only then `update products set active = true where id = '<id>'`.
- Next steps, in order: (1) a session or owner who can SEE images does the visual QA; owner can also use `/admin.html` AI product photo uploader on the phone. (2) Start with the 41 agrochemicals (insecticides, fungicides, herbicides): find the manufacturer or registrant packshot for the exact brand, formulation and pack size; skip supplier pages that show only a vendor logo (the Pyagro 4 mistake). (3) Fix the 3 Rentokil Lumnia `category_id`. (4) Activate each product only after QA, then check `?product=<slug>` on the mobile shell and rerun the product-pages workflow with the `gh api ... dispatches` command in CLAUDE.md. (5) Update this file after every product.

## 2026-11-18 00:40 (Africa/Nairobi) — Security PR: lock down `stm_send_email` (branch `wip-security-revoke-send-email`)
- Done: read-only review. `public.stm_send_email(text,text,text,text,text,text)` is SECURITY DEFINER, ungated, does an outbound HTTP POST, and is executable by PUBLIC/anon/authenticated, so anyone could send email as the store. Only the `orders_send_emails` trigger calls it (as owner postgres). The five staff RPCs (`record_sale`, `reverse_sale`, `restock_product`, `record_loss`, `admin_list_accounts`) all check `is_staff()` inside, so no change needed.
- Added `supabase/sql/security_revoke_send_email_public.sql` (revoke from public, anon, authenticated; keep service_role; verify and rollback lines included) and `docs/security/security-definer-followup-2026-11-18.md`. NOT applied to the live database.
- Not touched: `stm_order_email_trg()` (order function, not exploitable as an RPC), checkout/order/voucher/tracking/review/M-Pesa/card functions.
- Next: owner reviews the PR; after merge apply the SQL file as a migration, run the verify query, place one test order and confirm a new `email_log` row plus the "received" email. Rollback: the `grant ... to anon, authenticated` line in the SQL file.
- Blocked / dashboard only: Supabase Auth "Leaked password protection" is off; enable it in the Supabase dashboard (not a migration).

## 2026-11-15 13:50 (Africa/Nairobi) — PR #776 `validate` job fix (branch `feat/final-cro-trust-service-pages`)
Failing step in the SEO pull request quality gate (run 43703801865, read with `gh run view 43703801865 --log-failed`): "Run mobile shell browser regression suite" (`python3 mobile-shell/shell.test.py`), 2 FAIL lines then `TimeoutError ... waiting for locator("#grid .card[data-id]")` at line 598. The same failure reproduces on a clean `main` checkout, so it was not caused by the PR's one-line `app.js` change.
- Done: `mobile-shell/shell.test.py` — the tests were stale against two owner-approved behaviours already in `app.js` / the early script: (1) the shell address after `/?cat=<slug>` is the clean `/c/<slug>.html` (catUrl, owner 2026-11-09), not `/`; (2) a phone reloading that address is sent back to `/?cat=<slug>` by the `stm-early` script, which skips bot and "headless" user agents, so the reload test now uses an ordinary phone user agent and serves a generated category page for every `/c/<slug>.html`. Result locally: 171/171 pass (only the sandbox's blocked outbound image requests, `ERR_TUNNEL_CONNECTION_FAILED`, had to be ignored in a throwaway copy that was not committed).
- Done: `generate-products.mjs` line 664 — missing closing backtick on the product-page `body` template (introduced in `763e406`, already on `main`), `node --check generate-products.mjs` failed with `SyntaxError: Unexpected token '{'`. Fixed.
- Done: `mombasa.html` — broken internal link `/c/home-living.html` (no such page) now points to `/c/home-kitchen.html`; `node link-check.mjs` reports 0 problems.
- Not changed: `mobile-shell/app.js` (the PR's `if (!RESTORE_CAT) refreshGrid();` stays as is; reverting it made no difference), so no `?v=` bump was needed.
- Next: watch the next CI run on PR #776. Steps that need the live catalogue could not run here (no DNS in the sandbox): `node generate-products.mjs`, `seo-kenya.mjs`, `seo-overrides.mjs`, `seo-titles.mjs`, `seo-safe-meta.mjs`, `seo-shell-redirect.mjs`, `node seo-check.mjs > seo-pr-report.md`. Re-run command: `gh run list --workflow seo-pr-quality.yml --limit 3` then `gh run view <id> --log-failed`.
- Note for the owner: `shell.test.py` still has "category redirect removed" checks that pass only because headless Chromium is exempt from the early redirect; they contradict the 2026-11-08 decision to bring the phone redirect back.

## Done
- Created a clean working branch from `main`; the earlier branch `wip/technical-seo-kenya-2026-11` is 100 commits ahead of main and contains unrelated changes, so it will not be merged or deployed.
- Audited the canonical domain, homepage metadata/schema, robots.txt, sitemap.xml, product/category generator, services generator/data, service hub, shipping page, service guide index and current navigation script.
- Updated `generate-products.mjs` in commit `875963bb9e9480a8b24a4f7bebf340d6d4a5aefa` so categories with fewer than five products get `noindex, follow`.
- Updated the category generator so `stermont-cars-for-sale` and `mens-fashion` are emitted at canonical root destinations `/cars-for-sale.html` and `/fashion.html`, with noindex redirect stubs at their old `/c/` URLs. The old paths are excluded from the generated category URL list; the destination paths are included.
- Batch 1 PR #763 was merged to `main` on 2026-11-15 at 08:39:35 UTC (11:39:35 EAT). Batch 2 is isolated on the review branch below; its changes are not yet merged or deployed.

## Batch 1 — merged to main in PR #763
- Updated `mobile-shell/shell.test.py` so the fixture intercepts the current `rpc/get_store_catalog` endpoint; the legacy products route remains available for product-detail requests.
- Updated `mobile-shell/app.js` homepage recommendation sorting to prioritize Pest Control, Agrovet, Home Appliances/Home & Kitchen, then Phones/Electronics, with featured listings first inside each department. This is a merchandising priority, not a claim about verified sales volume.
- Bumped the homepage mobile-shell cache URL from `?v=38` to `?v=39`; no CSS, navigation, cart, M-Pesa or WhatsApp implementation was changed.
- Updated `404.html` with a functional GET search form, links to key shop categories, and retained the original 404 fallback script, WhatsApp contact, page styling and noindex directive.
- Updated `generate-products.mjs` so the retired `/c/stermont-cars-for-sale.html` and `/c/mens-fashion.html` stubs redirect to the homepage with a canonical homepage URL and `noindex,follow`. Their root-level category pages remain available as separate destinations.
- Verified `CNAME` already contains exactly `stermontarcade.co.ke`; homepage canonical and OG URLs already use the primary domain.
- Verified `robots.txt` already allows crawlable assets, avoids blocking search/filter query URLs, disallows admin/account pages, and lists the primary, product, image, service and pest-control sitemaps. No change was necessary.
- Verified `sitemap.xml` and product/service/image sitemap generation are already handled by existing build scripts/workflows; no manual sitemap rewrite was made, to avoid overwriting automatically maintained product/blog/service URLs.
- No change was made to M-Pesa, cart, checkout, WhatsApp, CSS, navigation menus, CNAME or Supabase configuration.

## Batch 1 commits
- `e6f93167acb0db0f90353ba2671aff6080468f24` — fix mobile shell test fixture for catalogue RPC.
- `7e9560e7002246bb80a6fdc812b608cf620a9197` — improve branded 404 search and category recovery.
- `1a6738169ef1b50a1125fe85d1d96f79c1da741e` — prioritize key departments in homepage recommendations.
- `3b0953b78fe537c08cd87b177f2bffdd3c711b28` — refresh mobile shell script cache after recommendation update.
- `1ac428c072569de75424a2f4a9513e3d149a8ce3` — redirect retired legacy category URLs to homepage.

## In progress
- Validate the generator change against the repository's build workflow and link checker.
- Review service-page source data and county-page generator before adding the requested service and county pages.
- Review navigation priority changes without altering mobile-shell interactions or styles.

## Blocked / limitations
- This environment has GitHub repository access but no checked-out working tree to run Node locally.
- GitHub Actions have not yet been run for this branch. Do not claim build, schema or link checks passed until an actual run reports success.
- The existing `HANDOFF-live.md` and `HANDOFF.md` referenced in `CLAUDE.md` were not present on main; this file establishes the live handoff on the working branch.

## Next
1. Run the product-page workflow's existing Node tests and build on a review branch, without changing workflow files.
2. Confirm the two destination category pages are generated and old URLs redirect correctly.
3. Implement the remaining service/county pages in their source generators/data, then run link and sitemap checks.
4. Open a review PR only after the branch contains only the intended SEO commits and all available checks have been run.
5. Merge to main only after review and successful verification; then check the canonical live URLs.


## Batch 2 — review branch
- Created `wip/seo-batch2-2026-11-15` from the post-Batch-1 `main` branch.
- Updated `seo-meta.mjs` so product titles continue to target the high-intent phrase “Price in Kenya”, while product/category meta descriptions and the product-page tagline include the truthful Sarit Centre / Nairobi pickup wording. Existing 60-character title and 155-character description limits remain in place.
- Updated `generate-products.mjs` social metadata to include descriptive Open Graph and Twitter image alt text; category-card images now use descriptive product-photo alt text. Existing image dimensions, lazy loading for below-the-fold cards, eager/fetch-priority loading for the primary product image, and deferred footer scripts were preserved.
- Audited and retained the existing visible breadcrumb navigation: product pages render Home > Category > Product; category pages render Home > Category. Product and category pages already emit BreadcrumbList JSON-LD. Category BreadcrumbList now matches the visible breadcrumb path rather than inserting an extra “All categories” crumb.
- Confirmed existing Product JSON-LD uses `priceCurrency: KES`; category pages already emit ItemList JSON-LD. No duplicate or speculative Product ratings were introduced.
- Added a separate `LocalBusiness` JSON-LD entity for the user-specified Sarit Centre, Westlands coordination and pickup office, linked to the existing OnlineStore entity. Existing address, telephone, opening hours, M-Pesa and KES values are reused consistently.
- Deferred the homepage mobile-shell and analytics external scripts. Existing Supabase preconnect remains in place. Inline routing/schema scripts remain synchronous intentionally.
- Validation performed through repository content inspection: all three homepage JSON-LD blocks parse as valid JSON; generated Product KES, category ItemList, BreadcrumbList, image dimensions/lazy loading, primary-image eager loading and deferred homepage scripts were confirmed in source. GitHub Actions build/SEO tests are still required before merge.

### Batch 2 commits
- `c957e4b0fc49a62f5ad2a10fc082df76198c4204` — add descriptive social image metadata and align category breadcrumbs.
- `c8fed3f87ebf0404594aa04104bed6f69c2ac71e` — add Sarit Centre LocalBusiness schema and defer homepage scripts.
- `7c987f1452ad98425f45d3728839b63ef5bad84f` — strengthen product metadata with Nairobi pickup intent.
- `b0d416a31005355b4985f0dd7ea249baf3cf2529` — improve generated catalogue image alt text.
- `f59444d69f0cdd6f8b204211a98ee5df5807cd33` — standardize Sarit Centre pickup wording for Nairobi search intent.

## Batch 2 next steps
1. Run GitHub Actions on the review PR and inspect every failing SEO/build/mobile-shell check.
2. Review generated product/category output and schema validation before merge.
3. Merge only after the owner reviews the PR and all required checks pass.

## Batch 2 CI failure follow-up — 2026-11-15
- Inspected failed GitHub Actions run #281 (`43695811898`), job `validate` (`132755961286`). The first failing step was `Run mobile shell browser regression suite`; all subsequent SEO/build checks were skipped because the job exited early.
- Root cause was stale test assumptions, not a runtime storefront regression: test expected 12+ products in the initial viewport although the shell intentionally paginates 8 at a time; it checked later-page products before scrolling to trigger pagination; and it expected an old shopping-bag emoji fallback although current code intentionally renders an accessible `Photo unavailable` label after gallery fallback exhaustion.
- PR #766 was already merged at `2026-11-15T08:45:11Z` (merge commit `c943f91e5f5fa29740ef323d20df95f13ec6072e`) before this correction could be added. A merged PR cannot be updated; this follow-up branch is therefore cut from the current `main` for a new review PR.
- Updated `mobile-shell/shell.test.py` only: assert the 8-item first page, scroll to trigger subsequent-page loading before checking database-name fallback, and assert the current `.photo-unavailable` fallback. No production storefront code changed.
- Fix commit: `5f824ada30ceed54c4b63fbdf0904c5f90276d01`.
- New follow-up PR and fresh GitHub Actions run are required. Do not start Batch 3 until the follow-up validation is green.

- Follow-up run #282 (`43696263282`) exposed one further flaw in the first test correction: scrolling the long homepage fixture did not reliably intersect the pagination sentinel in Playwright. Replaced that timing-sensitive approach with a deterministic category-chip selection for the garden fixture, whose complete eight-item category page includes the test products; the test then returns to “For you” before continuing. This remains a test-only change.
- Deterministic test correction commit: `9ea9dacd7f30ef0c000841c91668422b046d87a1`. Awaiting the next PR Actions run.

- Follow-up run #284 (`43696393998`) passed the corrected initial-page, database-name and unavailable-photo assertions, then exposed two additional stale assumptions in the test sequence: it checked the Home & Kitchen image while viewing the garden category, and checked/used the multi-size product from the paginated “For you” feed rather than its Home & Living category.
- Reordered the image assertion to the Home & Kitchen/default view and explicitly selected Home & Living for pack-size assertions and multi-size interaction, restoring “For you” afterward so later tests retain their expected starting state. Test-only change; no storefront runtime changes.
- Additional deterministic test fix commit: `66eb5e75af90c411a59b25a060c248a8ea3e851a`. Awaiting a fresh Actions run.

- Follow-up run #284 (`43696393998`) exact log inspection: the mobile-shell test reported two assertions failing and then timed out trying to click the multi-size card's `[data-add]` button. The photo assertion incorrectly required `src` although below-the-fold product cards intentionally use `data-src` until the lazy-image observer loads them. The category test switched chips without waiting for the category refresh to complete, and the later click repeated the same race after browser-history navigation.
- Corrected the image assertion to accept the intended lazy `data-src` or loaded `src`. Category-scoped pack-size and add-button checks now trigger the chip selection, wait for the visible Home & Living heading and for the actual card/button, and include useful failure context. This is test-only; no storefront production code changed.
- Latest test correction commit: `045ef7b614e604b01ea892b56bd3a8c4b07e0f50`. Fresh Actions run required.
- PR #766 cannot be updated because it was merged on 2026-11-15 at `08:45:11Z` (merge commit `c943f91e5f5fa29740ef323d20df95f13ec6072e`). PR #769 is the only open PR and carries the validation-only follow-up against current `main`; keep it open until green, then it can be merged/closed as the sole follow-up. Batch 3 remains blocked.

## Mobile-shell CI regression correction — 2026-11-15 (follow-up PR #769)
- Re-inspected the exact failed `validate` job logs for run #286 (`43696563650`, job `132758315683`). The browser suite recorded failures for the lazy-loaded category drawer photo assertion, Back navigation after selecting a category, retry after simulated network failure, and garden-set pack-size/quick-buy tests. The final uncaught timeout was waiting for `#grid .card[data-id="garden-set"] [data-add]` in a fresh context whose default “For you” feed is paginated to 8 items.
- Corrected only the browser regression fixture/assertions:
  - Count a real drawer image whether it is already loaded in `src` or correctly deferred in `data-src`.
  - Assert Back restores the previously selected Home category URL (`/c/phones-accessories.html`) while returning to the Home view; same for Back from Cart.
  - Retry success checks the actual first page size (8+) rather than the obsolete 12+ assumption.
  - Explicitly select Home & Living before garden-set pack-size/quick-buy tests in fresh contexts; update product URL expectations to the selected category URL and back.
- This preserves the real product/category URL behaviour and the production lazy-image behaviour. No storefront runtime code, styles, cart, checkout, M-Pesa, or WhatsApp logic changed.
- Fix commits: `5b11473f586a0c0a2d5ec8c48a4ab294758baaa9` and `2b8d78b07944f2e96cb33b11fe59ae04516efa54`.
- Await the full PR #769 Actions quality gate before merge or Batch 3.

- Follow-up Actions run #291 (`43697107784`, job `132760027416`) passed all browser checks through retry loading and tab reload/SEO-head checks, then timed out at `shell.test.py:390` waiting for the Cart view after changing an existing cart pack size. This exposed a real navigation race in `updateCartLine()`: it called `closeTop()` and immediately `goTab('cart')`, initiating two competing browser-history traversals.
- Fixed the underlying mobile-shell behaviour in `mobile-shell/app.js`: cart pack edits now call `goTab('cart')` once, allowing its existing `closeAllThen` flow to close the product overlay and switch tabs in one history transition. This is a runtime bug fix, not a weakened assertion.
- Fix commit: `8cd9c1f6b4d049eb170df6c752a9d0249dbdb3a0`. Await the new full quality-gate run on PR #769; Batch 3 remains blocked.

## 2026-11-16 11:20 (Africa/Nairobi) — PR #784 pre-merge cleanups (branch `feat/kenya-programmatic-seo-foundation`)
- Done (Supabase, owner-approved): `products.meta_description` trimmed on 226 rows (leading/trailing whitespace only); verified 0 rows with line breaks, double spaces or edge whitespace; 1543 non-null, max length 155. Categories have no `meta_description` values.
- Done: `CLAUDE.md` documents the approved SEO columns and the `robots.txt` step in `product-pages.yml`.
- Next: wait for CI on the final commit, then merge PR #784, then open an isolated Security PR (`add_draft_product` anon/PUBLIC revoke; review `is_staff` and search paths). Not touching checkout/order/M-Pesa functions.

## 2026-11-16 12:00 (Africa/Nairobi) — PR #784 merged; Security PR opened (branch `security/revoke-add-draft-product-public`)
- Done: PR #784 merged to `main` (merge commit `b5364c7`) after CI run on `c872be7` passed.
- Done: isolated Security PR with `supabase/sql/security_revoke_add_draft_product_public.sql` (revoke execute on the seven-argument `add_draft_product` from PUBLIC, anon, authenticated) and `docs/security/security-definer-followup-2026-11-16.md`. NOT applied to the database.
- Next: owner reviews the PR; apply the SQL as a migration only after approval; then verify `proacl`. Do not touch checkout, order or M-Pesa functions.

## 2026-11-16 12:30 (Africa/Nairobi) — Security PR #793 applied+merged; #784 deploy checked; category SEO backfill drafted (not applied)
- Done: migration `revoke_add_draft_product_public_anon_authenticated` applied in Supabase; `add_draft_product` (7 args) ACL is now postgres + service_role only; check_voucher, track_order, recent_purchases, rate_order_*, is_staff unchanged. PR #793 merged (`ffc10f2`).
- Done: merge `b5364c7` of PR #784: Build product pages, Workflow guard, Daily SEO check, SEO auto index all succeeded; its own "pages build and deployment" was cancelled because newer commits superseded it; later deploy `9ecc4b9` (descendant) succeeded.
- Drafted, NOT applied: category `meta_title`/`meta_description` backfill for 66 active categories (script kept in the Claude session scratchpad, awaiting owner OK on examples).
- Finding: `merchant-feed.xml` already exists (1463 items = active products; 80 inactive drafts excluded). Gaps: no `g:google_product_category`, no `g:shipping`, no gtin/mpn (identifier_exists=no).
- Next: owner approves category examples -> apply -> rebuild product pages (`gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`).


## 2026-11-18 — Automated image activation rule and Fumigation Chemicals publication
- Owner-approved permanent rule: remove human visual inspection as a publication gate. Exact product/pack match must be established from a legitimate Kenyan supplier/manufacturer product page title or URL; image bytes must pass HTTP 200, JPEG/PNG/WebP, >=500x500px, >15KB checks; `add_product_photo` must store the object and `products.images` must reference it. Then activate immediately once price, SEO, and PCPB/label gates pass. Upload success alone does not waive source identity or regulatory checks.
- Supabase table discovery: `public.store_publishing_rules` does not exist in this project. The existing canonical mirrors are `public.publishing_rules` (key `autonomous_bulk_product_publishing`) and `public.publishing_rule_configs` (key `autonomous_bulk_product_publishing_zero_prompt`); these are updated instead of creating a duplicate table.
- PCPB current public-health register (crawled 2026-11-18) confirms HAFETON 100 SC PCPB(CR)1932 and PARETO ROACH SPRAY PCPB(CR)1953. This clears the prior register-not-found hold, but not the image requirement for each exact pack.
- Category 37 activation scope: 10 products have stored images and are eligible under the automated source-match rule, excluding both SCUD variants pending the 50g/kg vs 50g/L concentration discrepancy: Navigator 100SC 20ml (KSh200), Hygienic 7.5% SC 100ml (KSh550), Air Chopper 7.5% SC 15ml (KSh200), Mende Mo Fire 5g (KSh200), Punisher 8.5% TA 20g (KSh300), Punisher 8.5% TA 500g (KSh6,400), Air Chopper 7.5% SC 30ml (KSh1,100), Hafeton 100 SC 1L (KSh6,650), Mende Mo Fire 250g (KSh2,750), Sevin Dudu Dust 200g (KSh200).
- Still inactive for missing exact-pack image: Kilex 0.5 Gel 5g (KSh900), Hafeton 100 SC 100ml (KSh1,100), Air Chopper 7.5% SC 100ml (KSh1,650), Air Chopper 7.5% SC 15ml 3 Pack (KSh900), Hygienic 7.5% SC 20ml (KSh1,100), Osefin 7.5 WP 200g (KSh750), Osefin 7.5 WP 100g (KSh550), Pareto Roach Spray 1L (KSh1,450). Pareto's PCPB status is confirmed but it remains inactive until an exact 1L image is uploaded. Hafeton 1L can be activated; Hafeton 100ml cannot yet.
- Both SCUD 5 WP 20g (KSh1,000) and 100g (KSh1,900) remain inactive until the concentration mismatch is resolved from the physical Kenyan label.
- Product links for active products use the mobile-shell format `https://stermontarcade.co.ke/?product=<slug>`. Static product-page/sitemap generation runs on the 30-minute schedule; verify the next `Build product pages` run and confirm generated URLs/sitemap before reporting pages deployed.
- Next: confirm activation SQL affected exactly the 10 listed IDs; check Actions workflow run, generated product pages, Product JSON-LD, sitemap.xml entries and lastmod; then replace this note with verified run/commit details.


## 2026-11-18 — Fumigation Chemicals automated-image publication result
- Rule files committed to `main`: AGENTS.md (84d71bad53b9694ba9f93b37ab70d4bd6e85797f), CLAUDE.md (a2ed779265287672b7de5fc7df9ba7c84a49a703), new `rules/publishing-rule.json` (98c62e28b93a343df418ac29f647f94065b05631). Handoff commit: e2cd2ab98ea108da312737df51272d97e7a03f9f.
- Supabase mirrors updated and verified: `public.publishing_rules` and `public.publishing_rule_configs`. The requested `public.store_publishing_rules` table does not exist in this project, so no duplicate table was created.
- Set `active=true` for exactly 10 category-37 products with exact-pack supplier images already stored: Navigator 100SC 20ml — KSh200 — `https://stermontarcade.co.ke/?product=navigator-100sc-20ml`; Hygienic 7.5% SC 100ml — KSh550 — `https://stermontarcade.co.ke/?product=hygienic-7-5-sc-100ml`; Air Chopper 7.5% SC 15ml — KSh200 — `https://stermontarcade.co.ke/?product=air-chopper-7-5-sc-15ml`; Mende Mo Fire 5g — KSh200 — `https://stermontarcade.co.ke/?product=mende-mo-fire-5g`; Punisher 8.5% TA 20g — KSh300 — `https://stermontarcade.co.ke/?product=punisher-8-5-ta-20g`; Punisher 8.5% TA 500g — KSh6,400 — `https://stermontarcade.co.ke/?product=punisher-8-5-ta-500g`; Air Chopper 7.5% SC 30ml — KSh1,100 — `https://stermontarcade.co.ke/?product=air-chopper-7-5-sc-30ml`; Hafeton 100 SC 1L — KSh6,650 — `https://stermontarcade.co.ke/?product=hafeton-100-sc-1l`; Mende Mo Fire 250g — KSh2,750 — `https://stermontarcade.co.ke/?product=mende-mo-fire-250g`; Sevin Dudu Dust 200g — KSh200 — `https://stermontarcade.co.ke/?product=sevin-dudu-dust-200g`.
- Still inactive: SCUD 5 WP 20g + 100g (concentration discrepancy); missing-image SKUs Kilex 0.5 Gel 5g, Hafeton 100 SC 100ml, Air Chopper 7.5% SC 100ml, Air Chopper 15ml 3 Pack, Hygienic 7.5% SC 20ml, Osefin 7.5 WP 100g and 200g, Pareto Roach Spray 1L. PCPB now confirms Hafeton PCPB(CR)1932 and Pareto PCPB(CR)1953; Pareto remains inactive only because its exact 1L image is missing. Hafeton 1L is live; Hafeton 100ml remains inactive pending its exact pack image.
- Verified Supabase update returned exactly the ten activated rows; all ten have non-empty `images`. The other ten new drafts remain inactive.
- Rebuild: product-pages workflow is scheduled every 30 minutes. A harmless source comment will be committed to `generate-products.mjs` to trigger its watched-path push workflow now. Check Actions run and deployment before claiming static HTML/sitemap refresh complete.

- Rebuild trigger commit: `fb8d00fe8b6c8328ed1bb0667563abdb4def322c` appends a harmless dated comment to watched source `generate-products.mjs`, causing the `product-pages.yml` push trigger to run. The available GitHub workflow-run lookup returns PR-triggered runs only, so it did not expose the main-branch push run; static HTML/sitemap deployment and `<lastmod>` remain **not independently verified** here. The repository's 30-minute scheduled workflow remains the fallback. Mobile-shell product links above are the permanent owner-approved link format; live database activation is verified.


## 2026-11-18 — Fumigation Chemicals description formatting repair
- Inspected active baseline descriptions (Darvin 50EW, Jacto HD 550, Abasi 5% EC). The storefront's canonical format is plain-text section labels / bullet lists parsed by `product-description-html.mjs` into styled semantic `h3`, `p`, `ul`, and `li` sections; raw HTML is not the stored format.
- Updated `product-description-html.mjs` to normalise inline Markdown H2/H3 drafts, standardise the seven buyer-guide section headings, preserve safe internal Markdown links, break long text into paragraphs of at most three sentences, and render four Q&A entries separately.
- Added product FAQPage JSON-LD generation to `generate-products.mjs`, only when exactly four authored Q&A pairs are present.
- Updated permanent description-formatting rules in `AGENTS.md`, `CLAUDE.md`, `rules/publishing-rule.json`, and Supabase publishing rule mirrors.
- Normalised the 20 new category 37 product descriptions in Supabase: inline Markdown H2 headings are now explicit section boundaries and four H3 FAQ prompts are represented as Q&A markers. All 20 records were updated; active/inactive state and product prices were not changed.
- Important content audit: the 20 existing descriptions are approximately 1,096–1,401 whitespace-token words each (the earlier quick count undercounted because it split on the wrong delimiter). Do not pad chemical content or invent pesticide rates/uses to hit a word count; expand only with verified product-specific facts and approved-label guidance.
- Git commits: rules/docs `c0108aae`, `7a8dfe8f`, `71573030`; renderer `eead0488`, `47ed09b3`, `5779fd33`, `8a83effa`, `c6395921`; generator / rebuild trigger `b5582e55`.
- Product-pages workflow should run from the generator push; verify the Actions result and live static HTML before claiming deployment is complete.

- Final verification: Supabase confirms 20 target rows, 10 active and 10 inactive (unchanged), all 20 with four FAQ markers and Markdown section boundaries. The canonical publishing rule and config both contain the description-formatting policy.
- Latest follow-up commits: renderer normalisation/export repair `3aa6f379`, legacy-heading compatibility `1e339a82`, Markdown/FAQ tests `96185dc6`, corrected test expectations `aa91418b`; final handoff checkpoint follows.
- `product-pages.yml` listens for pushes to `generate-products.mjs`, `product-description-html.mjs`, and its test file. The push therefore triggers a build; the GitHub connector only exposes PR-associated runs here, so a green run and deployed sitemap/product HTML have not been independently confirmed.


## 2026-11-18 — Canonical product-description sections and inline-heading repair
- Audited the exact 20 Fumigation Chemicals SKUs from the prior category-37 batch. A whitespace-token SQL count confirms the descriptions are already 1,096–1,401 words each (all exceed 800 words); they are not currently 350–486 words. All 20 retain four authored Q: FAQ entries. No extra chemical copy or dilution instructions were added merely to inflate length.
- Root cause: many stored Markdown headings were inline with the first sentence (e.g. `## Product overview Product Name is...`), so the renderer's line-based H2 parser did not recognise the section boundary.
- Updated `product-description-html.mjs` to split these legacy inline heading patterns at known sentence starts, map recognised heading topics into the seven canonical styled H3 sections, retain the source text, and keep paragraph splitting to at most three sentences. Added handling for common buyer, supplier, PCPB, PPE/safety, and fulfilment opening phrases.
- Added regression tests for inline legacy Markdown headings, canonical section order, internal service links and four FAQ extraction. `.github/workflows/product-pages.yml` includes `node product-description-html.test.mjs` and listens for renderer/test/generator pushes.
- Confirmed `generate-products.mjs` imports `extractProductFaq` and appends Product `FAQPage` JSON-LD only when exactly four Q&A pairs are parsed.
- Added the exact seven canonical labels and future-writing constraints to `AGENTS.md`, `CLAUDE.md`, and `rules/publishing-rule.json`; updated Supabase `publishing_rules` JSON config and `publishing_rule_configs` rulebook.
- Requested table `public.store_publishing_rules` does not exist in this Supabase project. Canonical tables updated instead; do not create a duplicate table without an explicit schema migration decision.
- Commits for this formatting pass: renderer `27132f89`, corrected parser `7b6de780`, permanent rule files `534aa429`, `76ed6226`, `716e73b2`, regression tests `460695bd`, additional start cues `4ff9ef59`, delivery cue `00a4b5de`.
- Pushes to renderer/test files trigger the product-pages workflow. Verify the Actions run and live generated HTML before claiming deployment is complete; connector does not expose a manual workflow-dispatch action.


## 2026-11-18 — Follow-up: category 37 heading coverage and internal copy suppression
- Rechecked all 20 exact product IDs in Supabase: 20 rows, 10 active and 10 inactive; descriptions contain 1,096–1,401 whitespace-separated tokens, and all 20 have exactly four Q: FAQ markers. No artificial text expansion was needed; the requested 800-word threshold is already exceeded.
- Renderer now maps the observed heading variants across all 20 descriptions (product identity/pack, registered target/use context, label/safety, buying/pack comparisons, ordering/delivery, FAQs) into the seven canonical section headings. Additional common first-sentence cues are recognised when headings and prose share a line.
- Customer-facing renderer suppresses internal supplier-price/baseline/markup calculation sections and internal “Listing status” draft notes. This avoids exposing sourcing arithmetic or unpublished operational notes on live product pages; the stored product-specific facts and FAQ answers remain intact.
- Added a regression test covering inline headings, all seven canonical headings, four FAQs, internal pricing/status suppression and service links.
- Latest renderer commits: `6f06db92` (initial internal-section filtering), `47afa2b5` (retain source heading for filtering), `09f6f000` (suppress price calculations), `ebd5bc34` (expanded title mapping), `021bd0f3` (additional section-opening cues). Latest test commit: `56e0b6b3`.
- The renderer and test pushes trigger `.github/workflows/product-pages.yml`. The available GitHub connection returned no commit status and does not expose manual workflow dispatch; therefore the automated build and live deployment still need a successful Actions run and generated-page inspection before being called complete.
