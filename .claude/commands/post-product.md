---
description: Post verified Stermont Arcade products to Neon using the governing publish_products rule (v6) and the canonical four-tier KES pricing.
---

# /post-product — Stermont Arcade product posting

**Precedence (owner-approved 2026-11-22):** new products are posted to **Neon** (project `restless-shape-79120240`, database `stermont`, table `public.products`), never to Supabase. The governing rule is the Neon row `public.publishing_rules` key `publish_products` (currently version 6; mirror `PUBLISH-PRODUCTS-RULE.md`). Where `CLAUDE.md`, `AGENTS.md` or `PUBLISHING.md` carry Supabase-era text (800+ word descriptions, Supabase Storage upload, Supabase duplicate check), `publish_products` wins. The admin tab `/admin.html#pricing-rules` reads that Neon row.

Before any product work read `HANDOFF-live.md`, then the live `publish_products` row from Neon (`select version, content from public.publishing_rules where key = 'publish_products'`), then `CLAUDE.md` / `PUBLISHING.md` for anything it does not cover.

## Non-negotiable defaults

1. Duplicate check against all three: `public.products` in Neon; `sitemap-products.xml` and `product-names.json` in this repo; the Supabase `products` table, read-only. Same brand, product and pack size is a duplicate. One pack size = one product.
2. Baseline cost in KES for the exact pack: lowest wholesale/trade price from a named Kenyan supplier, else lowest in-stock reputable Kenyan retail × 0.85. Store the URL in `attributes.cost_source` and `attributes.cost_basis` (`wholesale` or `retail_x0.85`; also `attributes.retail_reference_kes` for the fallback). Never use a range, an out-of-stock or old price, or an estimate.
3. Insert only: `name, category_id, description, cost, unit, images, meta_title, meta_description, alt_text, keywords, attributes`. Never set `price, old_price, stock, low_at, featured, active, slug` or `product_code`; the triggers set them (price from `price_4tier(cost)`: under KSh 20,000 +30%, 20,000–39,999 +25%, 40,000–60,000 +20%, above 60,000 +17.5%, at least 15% above cost, nearest KSh 50, minimum KSh 200; stock 1000; low_at 20; featured false; active false). Do not bypass or work around a trigger.
4. Skip Syngenta products unless the owner says otherwise in the chat. Skip SCUD 5 WP until its concentration discrepancy (50 g/kg vs 50 g/L) is resolved.
5. Photos (policy v6): take the image from the official manufacturer's or an authorized distributor's own product page for the exact brand, product and pack size; no separate written permission is needed for these sources. Not allowed: retailer-only or competitor pages, search thumbnails, generated or stretched images, anything with a competitor's logo, watermark or contact details. At least 500×500, loads as an image. Record `photo_source`, `photo_asset_url`, `photo_basis` (`manufacturer` or `authorized_distributor`), `photo_retrieved_on`, `photo_dimensions` and `pack_match_note` in `attributes`. Store a copy in the configured image host (Neon Object Storage or ImageKit) at a stable public HTTPS URL, never a presigned URL. No verified photo = the product stays inactive and is reported.
6. Description 60–120 words, plain English, only facts from the source pages. `meta_title` under 60 characters including "Price in Kenya"; `meta_description` under 155; 5–8 `keywords`; `unit` = pack size; accurate `alt_text`. Never invent specs, certifications, warranty or claims.
7. Pesticides, rodenticides, fumigants and veterinary medicines: confirm the current registration online (PCPB register; vet products via Kenya Veterinary Board / KEVEVAPI). Store `attributes.pcpb_reg` and `attributes.pcpb_source`. Never write rates, doses, approved uses or PPE unless a manufacturer or regulator page states them; otherwise say "follow the product label". No confirmed registration = inactive.
8. Publish (`active = true`, in a separate transaction) only when a verified photo, cost, description/SEO and (where item 7 applies) a confirmed registration are all present. Everything else stays inactive and is reported with the reason.
9. Verify: price equals `price_4tier(cost)`, stock 1000, low_at 20, no active product has zero images. Write one `admin_audit_log` row per published product (`actor_email` ntanamoupdates@gmail.com, `action` `publish_product`, `entity_type` `product`, details with cost, cost_basis, price and image count).
10. Use `shellProductLink(slug)` for every customer-facing product link. Never share `/p/<slug>.html` or `/classic.html`.

## Go-live note

The public storefront and page generator still read Supabase (checked 2026-11-22), so `active = true` in Neon does not show a product on the website yet. Do not switch the storefront to Neon until Neon holds the full live catalogue with images.

## Admin posting routes

- Catalog and Bulk Import create hidden drafts; they do not bypass the pricing trigger. Bulk CSV uses `baseline_cost_kes`, never a selling-price column.
- Activate only after every source, photo, price, duplicate, SEO and regulatory gate passes.
- Product pages are rebuilt by dispatching `product-pages.yml` (never edit that workflow). While Supabase REST returns HTTP 402 the page build cannot read the catalogue; record that blocker instead of retrying.

After publishing, record source store/URL, baseline cost, final price, product codes and validation results in `HANDOFF-live.md`.
