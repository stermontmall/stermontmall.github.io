# HANDOFF-live - newest progress log (read this FIRST, then HANDOFF.md)
Last saved: 2026-10-31 09:30 (Africa/Nairobi). GitHub + Supabase connected; NO clone this session (GitHub tools only), so nothing below was run.
RULE (owner): after EVERY step rewrite this file in the same minute (Done / In progress / Next / Blocked) so a session cut off by a usage limit can continue on another account. `HANDOFF.md` stays the long history; this file wins where they differ.

## NEWEST: Services copy to 600+ words, tenders, all cities (branch `wip-services-600-words`, 2026-10-31 09:30 Africa/Nairobi)
Owner (after phone screenshots of `/services/`): "add content to all the services, at least 600 words; creative, high-intent words; Nairobi and all cities in Kenya; appeal to organisational tenders; autosave on handoff".
FINDING: `services/word-counts.json` on `main` says the 8 landing pages already have 617-912 words, but the 8 guides have 373-543 words, and the hub `/services/` (`services/app.js`, 15 accordion items) shows only about 60 words per item. The hub is what the owner saw.
### Done (branch pushed, not merged)
- [x] `services/services-more.json` (new): per service a "contracts, institutions and tenders" section, a "near me: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and beyond" section and 5 search phrases; per guide 3-4 sections (quotation checklist, tenders, cities, safety). All 8 services and all 8 guides.
- [x] `services/build-services.mjs`: also reads `services-more.json` (appended after `services-extra.json`), and prints `UNDER 600 WORDS:` for any page below 600.
### In progress / Next (exact commands)
- [ ] RUN: `node services/build-services.mjs && cat services/word-counts.json` (or Actions > "Build services pages" on this branch). Expect no `UNDER 600 WORDS` line. If a guide is still short, add a section for it in `services-more.json` and re-run. Generated pages are NOT edited by hand.
- [ ] HUB (what the owner saw): the 15 accordion items in `services/app.js` are short. Options: (a) each item gets a "Read the full service page and price" link to its landing page (pest items -> pest page, cleaning items -> deep-cleaning page, CCTV -> cctv page, plumbing and electrical -> electrical-plumbing page, inverter -> solar page; 4G antenna and electric fence have NO landing page yet); (b) 15 separate pages of 600+ words each. Owner to choose. Not started.
- [ ] Merge to `main` only after the generator runs clean and 2 pages + 1 guide are opened on a phone. `services/sitemap-services.xml` is still not in `sitemap.xml` or Search Console.
### Blocked / owner
- Owner to confirm: the claims (90-day guarantee, low-odour, genuine parts, licensed staff), the price ranges, and the SERVICE AREAS. The copy says crews are based in Nairobi and Kitale, and that for every other town the customer sends the location and we confirm how we can help and the travel cost. It does NOT claim we serve every city. Change that sentence if you do.
- TENDERS: the copy does NOT claim any registration or licence (KRA PIN, business registration, NCA, PCPB, AGPO and so on). It says "tell us which compliance documents your tender requires and we confirm what we can supply". Give the real list of documents you hold and I will add them to every page.
- Words kept out on purpose: "best", "100%", "certified", "non-toxic", "eco-friendly", "guaranteed" (outside the 90-day wording).

## (previous) Services in the shop Categories tab (branch `wip-shop-services-categories`, 2026-10-31 09:10 Africa/Nairobi)
PR #86 (drawer link) and PR #87 (Categories tab link, `app.js?v=11`, shell.test.py 133/133) are MERGED. Phone check still open: reload the shop twice and open Categories.
- [ ] STILL OPEN: `services/sitemap-services.xml` in `sitemap.xml`/Search Console; owner confirms claims and price ranges.

## (previous) Services polish PR (branch `wip-services-polish`, 2026-10-31 09:05 Africa/Nairobi)
- [x] PR #83 (8 services + 8 guides) and PR #84 (hub links the 8 pages and guides, `services-extra.json`, violet theme) are merged and live on `main`.
- [ ] Open 2 service pages + 1 guide in a browser (not tested in one). Re-check: `node services/build-services.mjs && git status --short` (expect empty on `main`).

## IN PROGRESS before this (session started 07:45), still open
Owner: "Fix [doubled Buy], and continue with items description and seo and autosave on handoff".
1. [ ] FIX doubled "Buy" on every `/p/` page ("Buy Buy Original <n>" in the extra sections, FAQ, safe-use heading, WhatsApp text). Cause is in the generator side (`seo-product-extras.mjs` / `generate-products.mjs` / `seo-meta.mjs` `buyName`). Branch `wip-fix-double-buy` (not created yet). Fix = strip a leading "Buy " wherever the extras build a sentence around the name.
2. [ ] Batch 09 = Sprayers & Equipment (category slug `sprayers-equipment`): same method as batches 05-08 (facts only from catalog text, back up old text to `description_backup` batch `pest-batch-09` BEFORE writing, MD5 check, blogs-09.json 400-600 words, avoid "best", "100%", "g/L", "g/kg", "PCPB approved").

## Audit 2026-10-31 07:40 (automation check)
- [x] Blog tool works: bot "Update blog index and sitemap" commits 12 s after each merge. All 16 posts of batches 07+08 are in `blog/index.html` and `sitemap.xml`.
- [x] Product pages: batch 07 text is live. Batch 08 pages (e.g. Air Chopper) still showed the OLD text at 07:40; next "Build product pages" run (every 3 h) fixes it. Re-check Air Chopper, Fendona, Navigator.
- [ ] Cannot see from here: Actions run status and Search Console.

## Tests owed (run in a clone)
`node seo-meta.test.mjs; node buy-name.test.mjs; node seo-titles.test.mjs; node seo-pest/build.test.mjs; node seo-pest/blog.test.mjs; python3 mobile-shell/shell.test.py` (last known on `main`: 1246, 49, 35, 1047, 1365, 133 checks, 0 violations).

## State of `main` (2026-10-31)
- Shell: reload keeps tab (`app.js?v=7`), `/?cat=` (`v=8`), `/?tab=`/`/?q=` (`v=9`), `shell-chrome.js` top bar + bottom nav on account, track, shipping, returns, contact, faq, about, privacy, terms; category pages redirect phones to the shell. shell.test.py 133/133.
- SEO batches 05-08 (pest control) merged; 16 blogs for batches 07 and 08 on `main`.
- `CLAUDE.md`, `HANDOFF-live.md` on `main` (auto-save rule).

## Next (from HANDOFF.md "Left", in order)
1. Services pages (above), then the doubled "Buy" fix, then batch 09.
2. After the next "Build product pages" run: Air Chopper and Fendona pages show the new text with unchanged titles.
3. Shell step 4: native Track and Account tabs and checkout inside the shell; `/blog`, `/guides`, `/classic.html` still use their own look.
4. Then Animal Feeds, Veterinary, Fertilizers, Disinfectants, Seeds, electronics, appliances, kitchen, fashion.

## Blocked / needs the owner
- Phone checks: open stermontarcade.co.ke twice (service worker), Categories refresh stays on Categories, Account > Shipping, category link opens the shell, WhatsApp preview, one real small checkout, login once.
- Label data the catalog lacks: batch 07 (Mchwatox, Actellic 25EC, Grain-Save, fogger), batch 08 (Air Chopper, Darvin 50EW, Bat CRP, Tatua Demand 10CS), agro batches 01-04. Read the 16 blogs of batches 07 and 08 once.
- Decisions: "Best Price in Kenya" wording, fertilizer-page safety box, Search Console watch for "Page with redirect", Cloudflare headers if proxied.
