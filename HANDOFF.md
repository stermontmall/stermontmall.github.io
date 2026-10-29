# HANDOFF - Kenya SEO refactor (branch `wip-seo-kenya-meta`)

Task: product titles, meta tags, headings, slugs and JSON-LD tuned for Kenyan search intent.
Rule for this task: small steps, commit + push to `wip-seo-kenya-meta` after each, merge to `main` only when finished and tested.

## How the site is built (important)
The site is static. `p/*.html`, `c/*.html`, `guides/*.html` are GENERATED and the bot rebuilds them every 3 hours
(`.github/workflows/product-pages.yml`) from the Supabase catalog, then commits to `main`.
So: edit the generators, never the generated pages. Build order:

1. `generate-products.mjs` - builds every product page (`/p/`), category page (`/c/`), `products.html`, sitemap. Owns title, description, og:*, JSON-LD (Product/ProductGroup/FAQ/Breadcrumb), H1/H2 on product pages. Category copy lives in the `INFO` map.
2. `seo-kenya.mjs` - REWRITES product titles/descriptions after step 1 (`Buy <name> in Kenya | KSh X`) and category descriptions; builds `/guides/`.
3. `seo-product-extras.mjs` - description headings, "At a glance", "Safe use" box, breadcrumbs, internal links.
4. `seo-fixes.mjs` - meta/JSON-LD clean-ups.
5. `seo-overrides.mjs` + `seo-overrides.json` - hand-written titles/descriptions per product; always win.
6. `seo-auto-index.mjs` - meta/schema for hand-written pages (about, contact, faq, shipping, nairobi...).

## Files that govern what was asked
| Need | File |
|---|---|
| Product meta title/description, og:*, JSON-LD | `generate-products.mjs` (product loop) and `seo-kenya.mjs` (rewrites title/desc) |
| Product H1/H2 | `generate-products.mjs` (body template), `seo-product-extras.mjs` |
| Category meta, H1, copy | `generate-products.mjs` (`INFO`, category loop), `seo-kenya.mjs` |
| Slugs | `products.slug` column in Supabase; `slugOf` in `generate-products.mjs` |
| Hand-written pages head | `seo-auto-index.mjs`, the `.html` files in the repo root |
| Per-product overrides | `seo-overrides.json` |

## Already in place (verified in code)
- Product JSON-LD already has priceCurrency KES, dynamic price, InStock/OutOfStock, NewCondition, seller Organization "Stermont Arcade".
- og:title/description/image, og:type=product (product pages), og:locale=en_KE already emitted by `shell()`.
- Clean slugs and permanent slug redirects already exist.

## Decisions
- (pending) Titles: current pattern is `Buy <name> in Kenya | KSh X`. New pattern requested is `[Original] <name> <size> - Price in Kenya | Stermont Arcade`, max 60 chars.
- Claims must stay true: "PCPB Approved" only on pesticide/agrochemical categories; "Original/Genuine" only where a brand is known or the product is a registered agrochemical. No "same day delivery to 47 counties": shipping.html says same/next day for Nairobi, 1-3 days elsewhere.

## Done
- [x] Repo scanned, file map written (this file).

## Left
- [ ] Shared SEO helper module for titles/descriptions
- [ ] Product title/description pattern in `generate-products.mjs` and `seo-kenya.mjs`
- [ ] Product H1 + H2 sections
- [ ] Category title/description/H1
- [ ] JSON-LD check, OG check
- [ ] Local build test, then merge to main
