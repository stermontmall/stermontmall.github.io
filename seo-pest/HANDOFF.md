# HANDOFF - Pest control product copy, batch 01 (branch `wip-pest-copy-batch-01`, 2026-10-30)

Owner brief (2026-10-30): "Expert E-Commerce Conversion Copywriter & Local SEO Strategist for the Kenyan retail market": per product an SEO title (<65), meta title (<60, "in Kenya"), meta description (140-155 chars: price, benefits, M-Pesa, nationwide delivery), a description (hook, features, technical specifications, how to use, what's in the box) and 5-8 Kenyan buyer keywords. "Start with 10 products and make them live." Rule: small steps, commit + push to `wip-<task-name>` after each, keep this file updated, merge to `main` only when finished and tested.

This file lives in `seo-pest/` on purpose: the root `HANDOFF.md` is 36 KB and the GitHub file API replaces the whole file, so editing it from here risks damaging the history of earlier tasks.

## The 10 products (22 rows; one text per pack-size group, as in the agro batches)
Air Chopper 7.5SC (4 sizes), Miratex Pellets (2), Icon 10CS (1), Actellic 50EC (4), Actellic 25EC (1), Actellic Gold Dust (3), Premise 200 SC (2), Bayer Baraki Pellets (3 active sizes), Promax 20 EC Odourless Bed Bug (1), Kelvin Dudu Dust (1). Chosen from the home page "Popular products" and best-selling pest control groups that had generic or size-specific text. Navigator 100 SC was already done as a pilot (backup batch `pilot-01-navigator`, 2026-10-30 03:44 UTC) and is not touched.

## Done
- [x] Step 1: copy written as data in `seo-pest/batch-01.json`; `seo-pest/build.mjs` renders the stored plain text (same format as the Navigator pilot and the agro batches: CAPITAL headings and bullets, which `seo-product-extras.mjs` turns into h3 + lists) and the SQL; `seo-pest/build.test.mjs` = 210 checks, 0 violations (`node seo-pest/build.test.mjs`): 300-600 words, hook is 2 sentences, meta description 140-155 chars with price + M-Pesa + 47 counties, meta title < 60 with "in Kenya", seo_name < 65, 5-8 keywords, no banned claim, no dose or interval unless the batch marks it `labelData`, unknown active ingredient listed in `labelNeeded`, backup statement before the first update.

## Left
- [ ] Step 2: fix `seo-titles.mjs` (title without " – " made the H1 the whole SERP title), add `seo-overrides.json` meta descriptions for the 10 pages.
- [ ] Step 3: write to Supabase (backup first into `description_backup`, batch `pest-batch-01`), verify by query.
- [ ] Step 4: local page build check, merge to `main`, check 3 live pages after the next "Build product pages" run (merging `seo-overrides.json` / `seo-titles.mjs` triggers it).

## Decisions
- Owner PDF titles are NOT replaced. Seven of the 10 products already have a `seo_title` from the Master Catalog SEO Mapping PDF (Actellic 25EC, Actellic 50EC, Actellic Gold Dust, Baraki, Premise 200 SC, Promax 20 EC, Kelvin Dudu Dust). The HANDOFF of 2026-10-29 says the PDF wording wins, so only the three products with no title get a new `seo_name`/`seo_title` (Air Chopper, Miratex, Icon 10CS); the other seven get the new description and meta description only. The SQL only writes titles `where seo_title is null`. To switch a PDF title to the new format later, say so and it is one update.
- Dose / dilution rates are NOT invented (same rule as the agro batches). They are printed only when they come from the catalog text (Actellic Gold Dust: about 50 g per 90 kg, registration PCPB(CR) 1149) or from the manufacturer (Envu: Baraki bait amounts). Everything else says "see the product label".
- Banned claims stay out: "#1 Rated", "Top-Rated", "Guaranteed", "Certified", "PCPB approved", "100% genuine", "best price". Not backed by anything in the repo.
- Keywords have no database column, so they are kept in `batch-01.json` (`keywords`) for the owner and for page copy; they are not written to the database.
- Meta descriptions go through `seo-overrides.json` (the existing hand-written mechanism); `{price}` is filled from the built page, which for pack-size pages is the lowest size.
- Active ingredient sources: Actellic 50EC pirimiphos-methyl 500 g/L (Syngenta/Envu label, WHO prequalification list); Premise 200 SC imidacloprid 200 g/L (Bayer label); Icon 10CS lambda-cyhalothrin 100 g/L (Syngenta, AERU pesticide database); Baraki difethialone, Bitrex, bait amounts (Envu Africa product page); Gold Dust pirimiphos-methyl 16 g/kg (AERU) and thiamethoxam 3.6 g/kg (catalog text).

## Label data still needed from the owner (not found online, so the page says "see label")
- Air Chopper 7.5SC: active ingredient and strength, dilution, coverage.
- Miratex Pellets: active ingredient and strength, bait amount per point.
- Kelvin Dudu Dust: active ingredient, application rate.
- Promax 20 EC Odourless: active shown as propoxur 20% w/v, taken from a Kenyan Jiji.co.ke listing of Promax 20 EC; please confirm on the sachet (and the 50 ml size, taken from the owner's PDF).
- Actellic 25EC: 250 g/L is the strength implied by "25EC"; confirm on the bottle.
- Baraki: printed difethialone concentration (Envu page says 1.25 g/kg, a 2018 Ghana study says 0.0025%); not shown on the page.
- Premise 200 SC, Actellic 50EC/25EC, Icon 10CS: Kenyan-label dilution rates, spray volumes and re-entry times.
