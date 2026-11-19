# Stermont Arcade — canonical product posting and pricing rules

This file is the short operational guide. The full owner-approved rule is in `CLAUDE.md` / `AGENTS.md` and the staff-readable Supabase row `public.publishing_rules` with key `autonomous_bulk_product_publishing`.

## Single source of truth

- Website: https://stermontarcade.co.ke
- Repository: `stermontmall/stermontmall.github.io`
- Supabase project: `oewvtbnmyombbtggamor`
- Admin portal: `/admin.html#pricing-rules` (reads the canonical Supabase row directly)
- Database pricing function: `public.price_4tier(numeric)`
- Database insert guard: `public.products_posting_rules()`
- New product price rounding: `public.products_round_prices()`

Always read `HANDOFF-live.md`, `CLAUDE.md`, this file, and the canonical Supabase rule before a product batch. If a persistent rule changes, update GitHub and both Supabase rulebook mirrors in the same task.

## Exact pricing rule

Use a verified Kenyan baseline cost in KES for the exact product, brand/model and pack size. Use the lowest reliable Nairobi wholesale/distributor price where available. If only reputable Kenyan retail listings exist, baseline cost = lowest in-stock retail price × 0.85. Record the exact source store and URL in the handoff.

| Verified baseline cost | Markup |
|---|---:|
| Below KSh 20,000 | 30% |
| KSh 20,000–39,999 inclusive | 25% |
| KSh 40,000–60,000 inclusive | 20% |
| Above KSh 60,000 | 17.5% |

Order of calculation: verify baseline in KES → apply exactly one tier → enforce at least 15% above baseline cost → round to nearest KSh 50 → enforce KSh 200 minimum. Never guess, convert foreign currency without an approved rate, or apply a second markup. Set `old_price` only when a genuine previous/regular price is verified; never manufacture a discount.

**Syngenta:** skip new Syngenta products and leave existing Syngenta price/cost values untouched unless the owner explicitly instructs otherwise.

## Database enforcement and admin workflow

Every new row inserted into `public.products` is checked by `products_posting_rules()`:

- Requires a positive baseline cost in KES.
- Rejects new Syngenta rows under automatic pricing.
- Recalculates the selling price with `price_4tier()`; browser previews are not authoritative.
- Forces stock = 1000, low-stock alert = 20, featured = false and active = false.
- The insert-time price-rounding trigger preserves nearest-KSh-50 pricing. Existing product edits remain manual and are not repriced by the insert rule.
- A product cannot be activated without at least one saved image in `products.images`.

Admin routes:
- **Catalog:** enter the verified baseline cost; new products save as hidden drafts.
- **Bulk import:** use `baseline_cost_kes`, not `selling_price`; new rows save as hidden drafts and existing rows are never repriced.
- **AI photo uploader:** provide the exact source product page and matching photo. It reads the KES source price, applies the four-tier formula, and saves an unpublished draft. A manual selling-price override is not part of this new-product workflow.
- **Legacy `/list-products.html`:** redirects to the official Admin AI photo uploader; do not restore its former standalone posting form or 25% formula.
- **Pricing & posting rules:** reads the live canonical rule from Supabase; use its Refresh control to reload after a rule update.

Do not activate a draft until the exact product and pack photo, source, price, duplicate, SEO and regulatory checks pass. A similar product, generic category image, vendor logo or watermarked image is not acceptable.

## Mandatory inventory defaults

- `products.stock = 1000`
- `products.low_at = 20`
- `products.featured = false`
- New products start with `active = false`; activate only after every publishing gate passes.

## Product source and image checks

- Use a legitimate Kenyan supplier, distributor or manufacturer page for the exact product and pack.
- Confirm the source page title/URL and the image depict the same brand, model and pack size.
- Required image format: JPEG, PNG or WebP; minimum 500 × 500 px; file size greater than 15 KB; successful HTTP 200 download.
- Upload to Supabase Storage bucket `product-images`; verify the object exists and its exact URL is stored in `products.images`. Never hotlink an external image.
- If price or exact image cannot be verified, skip the candidate or leave the product inactive. Do not invent facts or prices.

## SEO and product content

- Write original, useful content for Kenyan shoppers. Target 800+ words only where verified product facts support it; never pad or fabricate.
- Store plain text/Markdown, not raw HTML. Use the canonical section headings:
  1. Product Overview & Key Benefits
  2. Technical Specifications & Pack Details
  3. Where & How to Use in Kenya
  4. Safety, Storage & Handling Guidelines
  5. Buying & Pack-Size Guide
  6. Delivery across Kenya & Nairobi Pickup
  7. Frequently Asked Questions
- Use exactly four buyer-focused FAQs when FAQPage JSON-LD is emitted; synchronise them 1:1.
- Include two or three relevant internal links. Keep paragraphs short and use real bullet lists for verified specifications.
- For pesticides/agrochemicals, check current Kenyan PCPB registration, authorised uses and label restrictions. Never invent dilution rates, PPE, efficacy or safety instructions. Keep SCUD 5 WP variants inactive until the known concentration discrepancy is resolved.

## Customer-facing links

Every link given to customers or staff must use `shellProductLink(slug)` and open `https://stermontarcade.co.ke/?product=<products.slug>`. Never use `/p/<slug>.html` or `/classic.html` as a human-facing link. The static `/p/` documents remain indexable for Google; preserve canonicals, sitemap and structured data. Run `node no-static-share-links.test.mjs`.

## Completion checklist

1. Verify exact product and pack, category and duplicates.
2. Verify source cost and record the source URL.
3. Let the database calculate and enforce the price and defaults.
4. Verify the exact image and Storage reference.
5. Write factual SEO content and structured data.
6. Activate only after all gates pass.
7. Rebuild product pages and sitemap; run the relevant tests.
8. Update `HANDOFF-live.md` with source store, URL, baseline cost, final price, product IDs, live links and exact validation results.
