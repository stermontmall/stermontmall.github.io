# HANDOFF - Kenya SEO refactor, part 2: power words (branch `wip-seo-power-words`)

Rule: small steps, commit + push to `wip-seo-power-words` after each, update this file with every push, merge to `main` only when finished AND tested.

## Part 1 (DONE, merged to `main` as PR #52, branch `wip-seo-kenya-meta`)
Shared builders in `seo-meta.mjs`, product pages (title, description, H1 trust word, 3 local H2 sections, `stm-seo v2` marker) in `generate-products.mjs`, category meta in `seo-kenya.mjs`. JSON-LD and OG already correct (KES, availability, seller, og:locale en_KE). Clean slugs + permanent redirects already exist (Task A).

## How the site is built (important)
The site is static. `p/*.html`, `c/*.html`, `guides/*.html` are GENERATED and the bot rebuilds them every 3 hours (`.github/workflows/product-pages.yml`) from the Supabase catalog, then commits to `main`. Edit the generators, never the generated pages.
1. `generate-products.mjs` - product (`/p/`), category (`/c/`) pages, sitemap. Calls `pdpTitle/pdpDescription/pdpHeadings` from `seo-meta.mjs`.
2. `seo-kenya.mjs` - category titles/descriptions via `catTitle/catDescription`; skips `stm-seo v2` product pages.
3. `seo-overrides.mjs` (+ `seo-product-extras.mjs`, `seo-fixes.mjs`) - hand-written `seo-overrides.json` always wins.
4. `seo-auto-index.mjs` - hand-written pages.

## Part 2 - this branch
### Done
- [x] `seo-meta.mjs`: product-type power-word layer. `productType(catSlug)` -> pest / agro / farm / general; `POWER` word lists per type; `powerWord()` picks deterministically (hash of the name, so no title flips on rebuild) and never repeats a word already in the name.
  - PDP title: `<Original | power word> <name> – Best Price in Kenya | Stermont Arcade`, max 60. Drop order when too long: store name, "Best", lead word, then shorten the name. "Price in Kenya" kept longest.
  - PDP description: `Buy 100% genuine & high-potency <name> in Kenya at Stermont Arcade. Fast M-Pesa checkout, Sarit Centre Westlands pickup, or countrywide delivery.` (max 155, 5 fallbacks). Descriptor by type: high-potency (pest, agro), quality (farm), top-quality (general); "100% genuine" only where `isGenuine`.
  - Category title: `Shop Top & Reliable <Category> Online in Kenya – M-Pesa & Delivery`, with shorter fallbacks to fit 60.
  - Category description: `Order PCPB-approved, top-quality <Category> at wholesale prices in Nairobi. Fast delivery across 47 counties with secure M-Pesa checkout.` PCPB wording only for PCPB categories; non-regulated categories get the same shape without "PCPB-approved".
- [x] `seo-meta.test.mjs`: `node seo-meta.test.mjs` - 250 checks (title <= 60, description <= 155, "Price in Kenya" present, no PCPB claim on product pages, no banned claims, no repeated words, deterministic), 0 violations. Run locally 2026-10-29.
- Function signatures unchanged, so `generate-products.mjs` and `seo-kenya.mjs` need no edit.

### Decisions
- Banned from generated copy: "#1 Rated", "Top-Rated", "Guaranteed", "Certified". They are verifiable claims; the site only has real reviews on 1 product and no certification paperwork on file. Also not used in titles: "Instant Knockdown", "Maximum Strength", "Commercial-Grade" (specific efficacy/strength claims; true only per product label). They can be added per product in `seo-overrides.json`.
- "Best Price in Kenya" follows the brief. Price-watch matches competitor prices, so it is defensible; the owner should confirm they are happy to keep it. To revert, delete the `Best Price` tiers in `pdpTitle` (3 lines).
- "Wholesale Price Nairobi" appears in category descriptions only (not product pages).
- The brief's category title is 60+ chars for most category names, so the 60-char limit forces the shorter fallbacks ("Shop Top <Category> Online in Kenya | Stermont Arcade").
- Part 1 decision kept: PCPB only on regulated categories; delivery wording never says "same-day to 47 counties".
- "Original" still beats a power word in the title when it is true (known brand or farm input), because counterfeit chemicals are the real buying worry.

### Left
- [ ] Full pipeline dry run with live data (needs network): Actions > Build product pages > Run workflow on branch `wip-seo-power-words`, then `node seo-check.mjs` (confirm it accepts the new title shapes; I could not run it from the sandbox) and open 3 pages (agrochemical, pest control, non-chemical).
- [ ] Open PR `wip-seo-power-words` -> `main`, review, merge (the push to `main` rebuilds live pages).
- [ ] Optional: H1 lead word variety (H1 still uses `trustName`, "Original <name>"); per-product `seo-overrides.json` entries for hero products (Bazooka etc.).
