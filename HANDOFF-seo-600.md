# HANDOFF - 600+ word SEO content standard (branch wip-seo-600-words)

Newest first. Read this together with HANDOFF-live.md (HANDOFF-live.md is 230 KB, so this task keeps its own short log until merged).

## 2026-11-08 Africa/Nairobi - caps found, standard written (NOT merged, NOT tested in CI)
Owner rules: all SEO, product, category and blog content must be quality, Kenya-focused, high-intent and OVER 600 words; save progress every step; emulate top Kenyan competitors and add unique value.

Where the word limits live:
1. `PUBLISHING.md` step 3: description 60-120 words -> REPLACED by the CONTENT STANDARD section (description 150-250 words + product-content.json 450+ words; page total over 600).
2. `product-content.test.mjs`: supplementary content must be 140-360 words -> ceiling raise to 900 (see next entry if done); 234 existing entries are still under the standard.
3. `seo-pest/build.test.mjs`: pest batch descriptions must be 400-600 words -> now 400-900, with a NOTICE listing any at or under 600 (STRICT_600=1 makes them fail).
4. Admin product editor (`catalog-v10.js`): description box stops at 4000 characters, so long-form text belongs in `product-content.json`.
5. Claim guards (banned words like best, top-rated, PCPB-approved, guaranteed, certified, KSh in text) are KEPT on purpose: they stop unprovable claims. The earlier wish for "Best / Top-Rated / PCPB-Approved" titles conflicts with them; needs an owner decision, per product proof.

Next (exact steps):
- [ ] Run `node product-content.test.mjs && node seo-pest/build.test.mjs` on this branch (sandbox here had no network).
- [ ] Research top Kenyan competitors per category (Jumia, Kilimall, Masterpiece Fumigation Services for pest) and record what they do and the gap we can fill.
- [ ] Expand existing pages in small batches (pest batches 01-07 first, then TVs/phones/appliances) to over 600 words each; commit per batch.
- [ ] Merge to main only when tests are green.
