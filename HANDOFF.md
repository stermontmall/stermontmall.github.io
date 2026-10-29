# HANDOFF - Kenya SEO refactor (branch `wip-seo-kenya-meta`)

Task: product titles, meta tags, headings, slugs and JSON-LD tuned for Kenyan search intent.
Rule for this task: small steps, commit + push to `wip-seo-kenya-meta` after each, merge to `main` only when finished and tested.

## How the site is built (important)
The site is static. `p/*.html`, `c/*.html`, `guides/*.html` are GENERATED and the bot rebuilds them every 3 hours
(`.github/workflows/product-pages.yml`) from the Supabase catalog, then commits to `main`.
So: edit the generators, never the generated pages. Build order:

1. `generate-products.mjs` - builds every product page (`/p/`), category page (`/c/`), `products.html`, sitemap. Owns title, description, og:*, JSON-LD (Product/ProductGroup/FAQ/Breadcrumb), H1/H2 on product pages. Category copy lives in the `INFO` map.
2. `seo-kenya.mjs` - after step 1: sets category titles/descriptions (seo-meta pattern), builds `/guides/`. Skips product pages marked `stm-seo v2` (they are already final); older pages still get `Buy <name> in Kenya | KSh X`.
3. `seo-overrides.mjs` runs `seo-product-extras.mjs` and `seo-fixes.mjs` first, then applies `seo-overrides.json` (hand-written titles/descriptions per product; always win).
4. `seo-auto-index.mjs` - meta/schema for hand-written pages (about, contact, faq, shipping, nairobi...).

Shared wording lives in `seo-meta.mjs` (pure functions: `pdpTitle`, `pdpDescription`, `catTitle`, `catDescription`, `trustName`, `pdpHeadings`).

## Files that govern what was asked
| Need | File |
|---|---|
| Product meta title/description, og:*, JSON-LD | `generate-products.mjs` (product loop) + `seo-meta.mjs` |
| Product H1/H2 | `generate-products.mjs` (`seoBoxes`, `h1`) |
| Category meta | `seo-kenya.mjs` (uses `seo-meta.mjs`); H1 and copy in `generate-products.mjs` (`INFO`) |
| Slugs | `products.slug` column in Supabase; `slugOf` in `generate-products.mjs` |
| Hand-written pages head | `seo-auto-index.mjs`, the `.html` files in the repo root |
| Per-product overrides | `seo-overrides.json` |

## Already in place (verified in code)
- Product JSON-LD has priceCurrency KES, dynamic price, InStock/OutOfStock, NewCondition, seller Organization "Stermont Arcade".
- og:title/description/image, og:type=product (product pages), og:locale=en_KE emitted by `shell()`.
- Clean slugs and permanent slug redirects already exist.

## Decisions
- Title pattern: `[Original] <name> \u2013 Price in Kenya | Stermont Arcade`, max 60 chars. If too long, drop "Original", then the store name, then shorten the name. "Price in Kenya" is kept longest.
- Description max 155 chars, always includes M-Pesa, Westlands/Sarit Centre pickup, 47 counties.
- Claims stay true: "PCPB approved" only on pesticide/agrochemical categories; "Original / 100% genuine" only where a real brand is known or the product is a farm input. Delivery wording matches shipping.html: Nairobi same/next day, 1-3 days elsewhere (never "same-day to 47 counties").
- Category pages now use `catTitle`/`catDescription` for ALL categories. This replaces the hand-written `INFO.title`/`INFO.desc` and the old "from KSh X" lead in the meta description (the cheapest-price guide still shows prices). `INFO.h1`, intro, guide and FAQ text are unchanged.
- Hand-written entries in `seo-overrides.json` still win over everything.

## Done
- [x] Repo scanned, file map written.
- [x] `seo-meta.mjs` shared builders (unit tested 2026-10-29: 0 title/description length violations over 36 product/brand/category combos; 0 on 6 categories).
- [x] Product pages in `generate-products.mjs`: new title/description, H1 trust word, 3 local H2 sections (target pests/uses, price + M-Pesa, delivery + Sarit Centre pickup), `stm-seo v2` marker.
- [x] `seo-kenya.mjs`: no longer overwrites v2 product titles/descriptions; category title/description use the new pattern (og/twitter too).
- [x] JSON-LD and OG checked in code: no change needed.

## Left
- [ ] Full pipeline dry run with live data: Actions tab > Build product pages > Run workflow > branch `wip-seo-kenya-meta` (the bot commits the rebuilt pages to the branch). Then run `node seo-check.mjs` and open 3 pages (agrochemical, pest control, non-chemical).
- [ ] Review the PR, then merge to `main` (the push to main rebuilds the live pages).
