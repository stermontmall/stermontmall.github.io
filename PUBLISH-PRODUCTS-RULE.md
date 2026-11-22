# READ THIS FIRST — Product publishing rule (Claude + ChatGPT)

If the owner says "publish products", "run the publish rule", or asks you to add products to the website, follow the rule below exactly. It is a permanent, fully autonomous standing instruction: the owner does not supply photos, descriptions, prices or SEO. Find everything online and publish directly.

## Where the rule lives
- **Source of truth:** Neon project `restless-shape-79120240`, database `stermont`, table `public.publishing_rules`, key `publish_products`.
  Load it with: `select content from public.publishing_rules where key = 'publish_products';`
- **This file** is a mirror so the rule is visible the moment GitHub is connected. If the two ever differ, the Neon row wins (check its `version` and `updated_at`).
- Also run `select key, version, title from public.publishing_rules;` to see the other rules (`00_read_me_first`, `supabase_legacy_rules`).

## How to connect
- **Claude:** connect the GitHub and Neon connectors, then say "publish products".
- **ChatGPT:** connect GitHub and Neon, ask it to read this file and the Neon rule, then say "publish products".
- Never use Supabase to add products. Supabase is quota-restricted; its hidden products are restored separately.
- Never put passwords, connection strings or API keys in this repo or in chat.

## Notes for assistants
- `rules/publishing-rule.json` and `AGENTS.md` / `CLAUDE.md` describe the older Supabase workflow. For posting to Neon, the rule below governs.
- Business focus: **Pest Control & Fumigation** and **Agrovet**.
- Check duplicates against Neon **and** this repo's `sitemap-products.xml` / `product-names.json` (the old Supabase catalogue returns when its quota resumes).

---

## The rule (mirror of Neon `publish_products`, version 7: v3 rule plus Kenyan third-party photo policy)

```
PUBLISH-PRODUCTS RULE v3 - FULLY AUTONOMOUS - PERMANENT STANDING INSTRUCTION
Owner: ntanamoupdates@gmail.com. Approved 2026-11-22.
When the owner says "publish products", "run the publish rule" or similar, follow this rule exactly. It works the same in Claude and ChatGPT.

THE OWNER DOES NOT SUPPLY ANYTHING
The owner does NOT upload photos, write descriptions, set prices or write SEO text. Find every detail online, write it, insert it and publish it directly. Do not ask the owner for photos, descriptions, prices or SEO. Ask only if the owner has not said how many products or which department, and then just use the defaults below. Report only at the end.

TARGET
Neon project restless-shape-79120240, database stermont, schema public, table products. Never use Supabase to add products. Default batch: 20 products per run, unless the owner gives another number. Business focus: Pest Control & Fumigation and Agrovet. Use General Merchandise only if the owner asks.

CATEGORIES (exact IDs)
- Agrovet & Farm Supplies: 43dbe459-0749-4a9e-8f59-12bbb0026be2
- Pest Control & Fumigation: 8782c41a-6cd5-4e08-b7a9-ea51c940d972
- General Merchandise: 6371a3e2-2d70-4967-a6f1-6c6c5f9d623f
- Cars for Sale: c1739dd5-19a5-45c0-80ea-3676258b746a
Sub-categories exist in public.categories (92 copied from the old shop, with legacy_id and parent_id). If a better sub-category fits, use its id; otherwise use the department id above.

STEP 1 - CHOOSE PRODUCTS (Nairobi demand) AND AVOID DUPLICATES
- Search the web for fast-selling, often-searched products in Nairobi, Kenya: Jumia Kenya and Kilimall best-sellers, Google Trends Kenya, Nairobi agrovet and pest-control shop listings, wholesaler catalogues, local classifieds. Favour repeat-demand products in small to mid pack sizes. One pack size = one product.
- Record why each sells in attributes.demand_note.
- Skip any product whose name contains "Syngenta" unless the owner explicitly says otherwise in this chat. Skip SCUD 5 WP until its concentration discrepancy (50 g/kg vs 50 g/L) is resolved. List what was skipped.
- Duplicate check against ALL of these before inserting: (a) public.products in Neon; (b) the old shop catalogue in GitHub repo stermontmall/stermontmall.github.io, files sitemap-products.xml and product-names.json (about 1,800 products, currently hidden but coming back); (c) the Supabase products table, read-only, if that connector is available. Skip duplicates and near-duplicates (same brand, product and pack size).

STEP 2 - BASELINE COST (KES), FOUND ONLINE
The database needs a positive KES baseline cost and sets the selling price from it.
- Use the owner's cost only if the owner volunteers one.
- Otherwise use the lowest wholesale or trade price in KES for the exact pack from a named Kenyan supplier, distributor or manufacturer page. Store the URL in attributes.cost_source and set attributes.cost_basis to 'wholesale'.
- If no wholesale price exists, use the lowest reputable in-stock Kenyan retail price for the exact pack x 0.85 as the baseline (owner-approved fallback). Store the URL in attributes.cost_source, the retail price in attributes.retail_reference_kes, and set attributes.cost_basis to 'retail_x0.85'.
- Never use a price range, an out-of-stock listing, an old price or an estimate. If there is no exact-pack price at all, leave that product out and report it.

STEP 3 - PHOTOS, FOUND ONLINE
- Take direct https image URLs from the manufacturer, distributor, supplier or retailer page for that exact product and pack. The image must clearly show the exact brand, product and pack size, be at least 500 x 500 px, and not a logo, stock photo of a different item, or competitor-watermarked picture.
- Check each URL opens and returns an image before saving. Put URLs in images (array), main image first. Write alt_text describing the photo. Store the page URL in attributes.photo_source.
- No verified photo = the product stays inactive and is reported.

STEP 4 - DESCRIPTION AND SEO, WRITTEN BY YOU
- description: 60 to 120 words, plain English: what it is, main use, pack size, who it suits. Only facts from the source pages. Never invent specs, certifications, warranty or claims.
- meta_title under 60 characters (include "Price in Kenya"). meta_description under 155 characters. keywords: 5 to 8 search terms Nairobi buyers use. unit: the pack size, for example "1 kg" or "50 ml".

STEP 4B - REGULATORY GATE FOR PESTICIDES AND VET PRODUCTS
For pesticides, insecticides, herbicides, fungicides, fumigants, rodenticides and veterinary medicines:
- Look up the current registration online (PCPB register at pcpb.go.ke; for vet medicines the Kenya Veterinary Board / KEVEVAPI listings). Store the number in attributes.pcpb_reg and the page in attributes.pcpb_source.
- Never write dilution rates, doses, approved crops/pests, PPE or label directions unless they appear on a manufacturer or regulator page; otherwise say "follow the product label".
- If registration cannot be confirmed online, the product is inserted as inactive and listed in the report. Do not publish it.

STEP 5 - INSERT (rules enforced by the database triggers)
- In one run_sql_transaction, insert only: name, category_id, description, cost, unit, images, meta_title, meta_description, alt_text, keywords, attributes.
- Do NOT set price, old_price, stock, low_at, featured, active, slug or product_code. The triggers set them: price from price_4tier(cost), stock 1000, low-stock alert 20, featured false, active false, slug from the name, product_code STM-######.
- Slugs must not end in a date or month. If rejected, set a clean slug in the form brand-model-pack. product_code is permanent. Never edit price after insert unless the owner asks.

STEP 6 - PUBLISH DIRECTLY
- Without asking the owner, set active = true, in a separate transaction, for every product that has: a verified photo in images, a cost, a written description and SEO, and (if Step 4B applies) a confirmed registration.
- Everything else stays inactive and is listed with the reason.

STEP 7 - VERIFY AND LOG
- Select name, slug, product_code, cost, price, stock, low_at, active, cardinality(images). Confirm: price equals price_4tier(cost), stock is 1000, low_at is 20, and no active product has zero images.
- Write one admin_audit_log row per product: actor_email ntanamoupdates@gmail.com, action 'publish_product', entity_type 'product', entity_id the product id, details with cost, cost_basis, price and image count.

OUTPUT
A short table: name, product code, cost, price, status (published, or inactive with the reason). Then list anything skipped, duplicated, missing a price or photo, or lacking a registration. If any step errors, stop and report it. Do not retry blindly, and do not work around a trigger.

LEGACY NOTE
Key supabase_legacy_rules holds the older Supabase-era rules. This rule (publish_products) governs on any conflict.


PHOTO SOURCING ADDENDUM — PERMANENT STANDING RULE (approved 2026-11-22)

The owner does not need to upload product photos. For every product, independently search online for the exact product and exact pack size. Search manufacturer first, then authorized distributor, Kenyan supplier, then reputable retailer. Use a direct image URL from the product page, not a search-results thumbnail.

Before saving: verify the URL loads as an image; confirm the visible brand, model/product, and pack size match the listing; confirm image dimensions are at least 500 x 500; and record the product-page URL in attributes.photo_source. Set accurate alt_text. Prefer clean, unwatermarked product photography. Do not use logos, generic category images, competitor-branded photos, AI-generated mockups presented as real product photography, or a different pack size. Never stretch or relabel an image to make it appear to match.

Use manufacturer/distributor/retailer assets only where their product/reseller use is permitted or reasonably authorized. If the source does not permit reuse or the image rights are unclear, do not copy or hotlink it as though owned; find an authorized asset or leave the product without a photo. Prefer storing authorized images in the configured product image host (Neon Object Storage or ImageKit) and use a stable public HTTPS URL. Do not invent storage URLs or treat a temporary presigned URL as a permanent product image.

If no exact, qualifying photo can be verified, leave images empty, keep the product inactive, and report the exact blocker. A near-match is not a match. Never activate a product solely because a photo was found; all v3 price, description, SEO, duplicate, and regulatory checks still apply. Photo-only updates must not change active status, price, stock, slug, or product code.

VENDOR PHOTO FALLBACK CLARIFICATION (owner-approved 2026-11-22): Search manufacturer, authorized distributor, Kenyan vendor, and reputable retailer product pages for exact product/pack photos. A vendor listing is a discovery/source lead, not by itself a reuse license. Before copying, downloading, hotlinking, or storing an image, require written permission, an explicit reuse license, or clear platform terms authorizing commercial reuse. Record the source page, direct asset URL, permission/license evidence, retrieval date, dimensions, and exact-pack verification in product attributes/audit log. If permission is absent or unclear, request permission or use an authorized manufacturer/distributor asset; do not attach the image and do not activate the product. Never substitute search thumbnails, generated previews, similar products, or different pack sizes. All existing photo quality, regulatory, cost, SEO, and activation checks remain mandatory.

 
KENYAN THIRD-PARTY PRODUCT PHOTO RULE v7 — OWNER-APPROVED 2026-11-22

The owner authorizes sourcing product photos from other websites operating in Kenya, not only manufacturers or authorized distributors. Eligible sources now include Kenyan agrovets, pest-control suppliers, wholesalers, retailers, marketplaces (including Jumia Kenya and Kilimall), and other Kenyan commercial product listings, provided the image shows the exact product and exact pack size sold by Stermont Arcade.

For every candidate: verify exact brand/product/pack/formulation, confirm the image loads and is at least 500 x 500 px, and record the original product-page URL, direct asset URL, source business/site, retrieval date, dimensions, and exact-pack match note in product attributes. Use source basis 'kenyan_vendor'. Prefer clean genuine images without seller watermarks, contact details, price overlays or competitor branding. Never use logos, generic images, search thumbnails, AI mockups, relabelled images or near-matches.

Store qualifying images on Stermont's configured stable public image host (Neon Object Storage or ImageKit) and use the stable HTTPS URL in images. Do not invent URLs or hotlink temporary URLs. Check source-site terms and applicable image rights before copying or republishing. The owner's instruction authorizes this sourcing workflow but does not transfer copyright or override site terms. If reuse is prohibited, expressly restricted or materially unclear, seek permission or use another source. Do not remove watermarks or ownership notices; retain source attribution.

This v7 rule supersedes the v6 restriction against retailer-only/competitor pages, subject to the checks above. Manufacturer and authorized-distributor images remain preferred. All cost, description, SEO, duplicate and regulatory checks remain mandatory. No qualifying photo means inactive product. A photo-only update must not change active status, price, stock, slug or product code.

```
