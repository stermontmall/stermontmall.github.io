# HANDOFF - Kenya SEO refactor, part 2: power words (ALL CODE DONE, merged and live-verified; only owner decisions left)

Rule: small steps, commit + push to a `wip-<task-name>` branch after each, update this file with every push, merge to `main` only when finished AND tested.

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
- [x] Merged to `main` as PR #53 (branch `wip-seo-power-words`) on 2026-10-29.
- [x] Workflow gap fixed (PR #54, `wip-power-words-followup`): `product-pages.yml` did not watch `seo-meta.mjs`, so merging PR #53 did NOT trigger a rebuild. It now does.
- [x] Category title fallback (PR #55, `wip-category-title-fallback`): `generate-products.mjs` now calls `catTitle`/`catDescription` for small categories, and skips a variant label already contained in the name (`labelInName`).
- [x] Visible on-page wording (PR #56, `wip-power-words-h1`): H1 uses `pdpH1`, with a visible line under it from `pdpTagline`.
- [x] Live check #1, 2026-10-29: 287 product pages inspected, all titles <= 60 chars, 46 use "Best Price in Kenya", 130 use "Price in Kenya", no banned words anywhere.
- [x] Live check #2, 2026-10-29 (file inspection of `main`, no browser), the previously open items:
  - All 8 small categories now have the new title, all <= 60 chars: watches-jewellery, electrical-lighting, protective-wear-safety, computing, garden-outdoors, health-beauty, phone-accessories, womens-fashion. No "Prices and Delivery" titles remain in `c/`.
  - `p/xiaomi-poco-c71-3gb-ram-64gb.html`: title is "Original Xiaomi Poco C71 3GB RAM + 64GB – Price in Kenya" (no duplicate spec; the "3GB + 64GB" label survives only in the price unit text, which is intended).
  - H1 + tagline confirmed on a phone page (Poco C71, "100% genuine & top-quality") and a pest page (Gradometer 480EC, "100% genuine & high-potency"). Milthane (agro) was only matched by code search, not read in full.

### Decisions
- Banned from generated copy: "#1 Rated", "Top-Rated", "Guaranteed", "Certified" (verifiable claims; no reviews/paperwork to back them). Also not used: "Instant Knockdown", "Maximum Strength", "Commercial-Grade" (true only per product label). They can be added per product in `seo-overrides.json`.
- "Best Price in Kenya" follows the brief; price-watch matches competitor prices. Owner to confirm. To revert, delete the `Best Price` tiers in `pdpTitle` (3 lines).
- "Wholesale Price Nairobi" in category descriptions only.
- Category title limit is 60 chars, so most categories use the shorter fallbacks ("Shop Top <Category> Online in Kenya | Stermont Arcade", or the "– M-Pesa & Delivery" / bare variants when that is too long).
- PCPB wording only on regulated categories; delivery wording never says "same-day to 47 counties".
- "Original" still beats a power word when true (known brand or farm input).
- PR #53 was merged BEFORE the live-data run, which broke the "merge only when tested" rule. The live checks above have now passed, so the revert fallback is no longer needed.

### Notes (not bugs)
- When the 60-char title limit leaves no room, the title can omit "Original" while the H1 still leads with it (e.g. Gradometer: title ends "Best Price in Kenya", H1 starts "Original Gradometer ..."). Fine for SEO; change `pdpTitle` if the owner wants them identical.
- The H1 tagline says "Best Price in Kenya" on every product, so the owner decision below covers it too.

### Left
- [ ] Owner to confirm "Best Price in Kenya" and "high-potency" wording are acceptable (revert recipe above).
- [ ] Optional: per-product `seo-overrides.json` entries for hero products (Bazooka etc.).
- [ ] Optional: read one agro page (Milthane) in full to close the H1 tagline check.
