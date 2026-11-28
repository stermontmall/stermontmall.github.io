# Permanent SEO / indexing fix: task brief for ChatGPT
Written 2026-11-28 about 11:58 Africa/Nairobi, against main 6eb94a5. Re-check everything: other agents also change this repo.

## Rules
- Read AGENTS.md, CLAUDE.md and the top of HANDOFF-live.md first.
- Work on a new `wip-` branch from latest main. Small commits. Add an entry to the top of HANDOFF-live.md and push after every step.
- Merge to main only when tested. Report anything not tested.
- Do not redo finished work. Do not hand-edit generated pages or sitemaps; fix the generator or source data.
- Never edit `.github/workflows/product-pages.yml` (Publishing Rules V8, section 13).
- Ask the owner before changing Neon data, deleting anything or closing PRs.
- Never commit secrets. Never create or reuse a certificate of analysis. Add one only if the owner supplies it for the exact product and batch.

## Already done (do not redo)
PRs #1273 (one page per product), #1268 (keep old redirects), #1278 (4 bad redirect rows), #1269 (homepage).
All 683 active products had stock > 0 and were in sitemap-products.xml. 7 were set to stock 1000 at the owner's request;
earlier notes said physical stock was unconfirmed (STM-002475 to STM-002481).

## Step 0: review open PRs (only titles have been checked)
Indexing #1262 #1263 #1260; titles/descriptions #1239 #1249 #1255; old redirects #1237; links/other #1272 #1274 #1276.
For each: still needed, superseded or conflicting? Reuse good work. Report before writing duplicate code.

## Tasks, in order. Each needs an automated test that stops it coming back.
1. Old addresses. `data/gsc-missing-product-urls-2026-11-28.csv` has 375 Google-indexed /p/ URLs with no file in main.
   (The export was capped at 1,000 URLs, so there may be more.) Check Neon `product_slug_redirects` and `data/old-url-redirects.csv`.
   Propose: matching product, relevant category, or stay not found. No blanket homepage redirects. Owner reviews the list first.
   Also give the owner about 27 old-pack-size redirects to review, including bat-crp-bat-repellent-1-litre (liquid -> powder;
   the Neon row overrides the CSV). Guard: a build must not silently drop a previously published URL or redirect.
2. Titles and descriptions. 22 product titles exceed 75 characters; "Raid Electric Refill 22ml Price in Kenya" is used twice.
   Last site audit (before the latest rebuild): 14 short meta descriptions, 2 duplicate-title issues. Fix in generator/overrides.
   Keep brand and pack size. Guard: tests for long and duplicate titles and short descriptions on new products.
3. Sitemap submission. In google-sitemap-ping.yml a change inside the 3-hour cooldown is skipped and has no dedicated follow-up
   (it waits for a later eligible run or the daily one). Make pending changes get submitted soon after the cooldown,
   without extra pings when nothing changed. Compare with the last successful submission.
4. Index checker (seo-index-status.mjs). Check current-sitemap URLs with no saved result first, then the oldest.
   Product counts must include only current sitemap URLs (the view product_index_summary counts all saved /p/ results;
   changing the view is a Neon change, so ask first). Keep within Google's quota; do not add runs or raise MAX_URLS above 200.
   GitHub showed fewer scheduled runs than configured (2 on 11-26, 3 on 11-27 against 8 a day); cause not confirmed.
   Do not use Google's Indexing API for product pages.
5. Out-of-stock policy. generate-products.mjs puts only stock > 0 products in sitemap-products.xml. Propose keeping
   temporarily out-of-stock pages listed and marked OutOfStock; get owner approval, since this was a deliberate rule.

## Done means
Tests pass, "Build product pages" succeeds after merge, sample old and current URLs checked on the live site
(or clearly reported as not checked), HANDOFF-live.md updated. Indexing and rankings are not guaranteed.
