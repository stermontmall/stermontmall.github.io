# HANDOFF - Kenya SEO refactor, part 2: power words (merged; live check done on built pages, one fix on `wip-category-title-fallback`)

Rule: small steps, commit + push to a `wip-<task-name>` branch after each, update this file with every push, merge to `main` only when finished AND tested.

## Task: product title + H1 modifiers (branch `wip-product-title-modifiers`, IN PROGRESS, not merged)
Request (2026-10-29): "Powerful", "Best", "Top-Quality", "Original" must show in the product page `<title>` and H1.
Baseline measured on the product pages committed on `main` (183 pages in `p/`): 90 titles had no modifier word at all (long names fall to a tier that drops the lead word), the H1 never showed "Powerful" or "Top-Quality" ("Powerful" is skipped whenever "Original" applies, and the general list had "Top", not "Top-Quality").
Plan, each step committed and pushed:
1. [x] This plan.
2. [x] (tests pass, 610 checks) `seo-meta.mjs`: general list gets "Top-Quality" (replaces bare "Top"); H1 carries BOTH the trust word and the power word ("Original Powerful <name>").
3. [x] (checked on the 183 real product names x 4 category types: 0 titles over 60 chars, 0 without a modifier; trade-off: a very long name loses up to ~9 characters to the lead word) `seo-meta.mjs`: title fallback keeps the lead word when the name has to be clipped, so every title carries a modifier.
4. [x] (`node seo-meta.test.mjs`: 850 checks, 0 violations) `seo-meta.test.mjs`: assert every title and H1 carries a modifier; run it.
5. [ ] PR #57 is open, NOT merged. Real-names check done (183 names). A full `node generate-products.mjs` could not run from the cloud session (Supabase host unreachable), so the first live rebuild is untested. Merging triggers the rebuild (workflow watches `seo-meta.mjs`); after it, check 3 pages' `<title>` and H1. Revert = revert PR #57. Original step: Check against the real product names in `p/*.html`, then merge to `main` and confirm the rebuild.

## Part 1 (DONE, merged to `main` as PR #52, branch `wip-seo-kenya-meta`)
Shared builders in `seo-meta.mjs`, product pages (title, description, H1 trust word, 3 local H2 sections, `stm-seo v2` marker) in `generate-products.mjs`, category meta in `seo-kenya.mjs`. JSON-LD and OG already correct (KES, availability, seller, og:locale en_KE). Clean slugs + permanent redirects already exist (Task A).

## How the site is built (important)
The site is static. `p/*.html`, `c/*.html`, `guides/*.html` are GENERATED and the bot rebuilds them every 3 hours (`.github/workflows/product-pages.yml`) from the Supabase catalog, then commits to `main`. Edit the generators, never the generated pages.
1. `generate-products.mjs` - product (`/p/`), category (`/c/`) pages, sitemap. Calls `pdpTitle/pdpDescription/pdpHeadings` from `seo-meta.mjs`.
2. `seo-kenya.mjs` - category titles/descriptions via `catTitle/catDescription`; skips `stm-seo v2` product pages.
3. `seo-overrides.mjs` (+ `seo-product-extras.mjs`, `seo-fixes.mjs`) - hand-written `seo-overrides.json` always wins.
4. `seo-auto-index.mjs` - hand-written pages.

## Part 2 - power words
### Done
- [x] `seo-meta.mjs`: product-type power-word layer (pest / agro / farm / general), deterministic pick, never repeats a word already in the name. New PDP title, PDP description, category title and category description patterns (see the code comments above each function).
- [x] `seo-meta.test.mjs`: `node seo-meta.test.mjs` - 250 checks, 0 violations (run 2026-10-29 before the merge).
- [x] `seo-check.mjs` verified compatible with the new title/description shapes.
- [x] Merged to `main` as PR #53 (branch `wip-seo-power-words`) on 2026-10-29 at 17:23 EAT.
- [x] Workflow gap fixed (PR from `wip-power-words-followup`): `product-pages.yml` did not watch `seo-meta.mjs`, so merging PR #53 did NOT trigger a rebuild. It now does.

### Decisions
- Banned from generated copy: "#1 Rated", "Top-Rated", "Guaranteed", "Certified" (verifiable claims; no reviews/paperwork to back them). Also not used: "Instant Knockdown", "Maximum Strength", "Commercial-Grade" (true only per product label). They can be added per product in `seo-overrides.json`.
- "Best Price in Kenya" follows the brief; price-watch matches competitor prices. Owner to confirm. To revert, delete the `Best Price` tiers in `pdpTitle` (3 lines).
- "Wholesale Price Nairobi" in category descriptions only.
- Category title limit is 60 chars, so most categories use the shorter fallbacks ("Shop Top <Category> Online in Kenya | Stermont Arcade").
- PCPB wording only on regulated categories; delivery wording never says "same-day to 47 counties".
- "Original" still beats a power word when true (known brand or farm input).
- PR #53 was merged BEFORE the live-data run, which breaks the "merge only when tested" rule. Live check below is therefore the open item, and the fallback is to revert PR #53 if it fails.

### Left
- [x] Live check, 2026-10-29 (file inspection of the pages committed by the "Build product pages" run after PR #54, 287 pages, no browser): all product titles <= 60 chars, 46 use "Best Price in Kenya", 130 use "Price in Kenya", no banned words anywhere. Milthane (agro), Gradometer (pest) and an electric hot plate (general) look right.
- [ ] Found: 8 small categories (< 3 priced items: watches-jewellery, electrical-lighting, health-beauty, computing, garden-outdoors, protective-wear-safety, phone-accessories, womens-fashion) kept the OLD title "Buy X in Kenya | Prices and Delivery | ..." (62-70 chars), because `seo-kenya.mjs` skips categories with < 3 items and `generate-products.mjs` used its own fallback. Fixed on `wip-category-title-fallback` (generator now calls `catTitle`/`catDescription`). Needs a merge and one rebuild, then re-check those 8 pages.
- [x] Fixed on `wip-category-title-fallback`: duplicate spec in one title, `p/xiaomi-poco-c71-3gb-ram-64gb.html` ("3GB RAM + 64GB – 3GB + 64GB"). `generate-products.mjs` now skips a variant label when every word/number of it is already in the name (`labelInName`). Verify after the next rebuild.
- [ ] Owner to confirm "Best Price in Kenya" and "high-potency" wording are acceptable.
- [x] Visible on-page wording (branch `wip-power-words-h1`): the H1 now uses `pdpH1` (same lead word as the title: "Original" when true, else a power word) and a visible line under it from `pdpTagline`: "Best Price in Kenya · 100% genuine & high-potency · M-Pesa checkout · Delivery to all 47 counties" ("100% genuine" only where `isGenuine`). Before this the power words were only in the <title> and meta description, not on the page. Check 3 pages after the rebuild.
- [ ] Optional: per-product `seo-overrides.json` entries for hero products (Bazooka etc.).
