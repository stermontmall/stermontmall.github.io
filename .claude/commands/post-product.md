---
description: Post verified Stermont Arcade products using the canonical four-tier KES pricing rule and mandatory publishing checks.
---

# /post-product — Stermont Arcade product posting

Read `HANDOFF-live.md`, `CLAUDE.md`, `AGENTS.md`, `PUBLISHING.md`, and the Supabase row `public.publishing_rules` / `autonomous_bulk_product_publishing` before product work. The admin portal's **Pricing & posting rules** tab reads this same Supabase source.

## Non-negotiable defaults

1. Check exact duplicates by product name, brand/model and pack size. Preserve pack variants.
2. Use the lowest reliable Kenyan wholesale/distributor baseline in KES. If only reputable retail prices are available, use lowest in-stock retail × 0.85. Record the source store and exact URL.
3. Apply the official tiers to baseline cost: under KSh 20,000 = +30%; KSh 20,000–39,999 = +25%; KSh 40,000–60,000 = +20%; above KSh 60,000 = +17.5%.
4. Enforce the 15% minimum above baseline, round to nearest KSh 50, and enforce KSh 200 minimum. Use `public.price_4tier()`; do not hardcode a competing formula.
5. Skip new Syngenta products unless the owner explicitly instructs otherwise.
6. Every new product gets stock 1000, low_at 20, featured false and active false. The database insert trigger enforces price and inventory defaults. Do not bypass it.
7. Verify an exact brand/model/pack image from a legitimate supplier/manufacturer page: HTTP 200, JPEG/PNG/WebP, at least 500×500, over 15 KB. Upload to `product-images`, verify the Storage object and `products.images` URL. Do not publish generic or mismatched images.
8. Write original factual SEO content, targeting 800+ useful words only where verified facts support it. Use the seven canonical sections, exactly four matching FAQs where FAQPage JSON-LD is emitted, and 2–3 relevant internal links.
9. Check PCPB registration and Kenyan label restrictions for agrochemicals. Never invent pesticide rates or safety instructions.
10. Use `shellProductLink(slug)` for every customer-facing product link. Never share `/p/<slug>.html` or `/classic.html`.

## Admin posting routes

- Catalog and Bulk Import create hidden drafts; they do not bypass the database pricing trigger.
- Bulk CSV uses `baseline_cost_kes`, never a customer selling-price column.
- AI photo uploader reads the exact source page and calculates the official four-tier price; it saves a draft for final checks.
- Activate only after every source, image, price, duplicate, SEO and regulatory gate passes.

After publishing, rebuild pages and sitemap, run the relevant tests, and record the source store/URL, baseline cost, final price, product IDs, live URLs and validation results in `HANDOFF-live.md`.
