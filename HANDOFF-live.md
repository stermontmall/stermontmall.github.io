# HANDOFF-live - newest progress log (read this FIRST, then HANDOFF.md)
Last saved: 2026-10-31 09:00 (Africa/Nairobi). GitHub + Supabase connected; clone available this session.
RULE (owner): after EVERY step rewrite this file in the same minute (Done / In progress / Next / Blocked) so a session cut off by a usage limit can continue on another account. `HANDOFF.md` stays the long history; this file wins where they differ.

## NEWEST: Services link in the shop (branch `wip-shop-services-link`, 2026-10-31 09:00 Africa/Nairobi)
Owner: the Services section is not reachable from the shop ("All categories" drawer had no Services). In progress: `mobile-shell/app.js` `renderDrawer()` now puts a "Services" link to `/services/` first in the drawer; `index.html` `app.js?v=9` -> `v=10`. PR #84 (services hub links, violet theme) is merged and deployed (pages build #722 green).
- [ ] NEXT: `python3 mobile-shell/shell.test.py` (expect all pass), PR, merge, then owner reloads the shop twice (service worker) and opens All categories.
- [ ] STILL OPEN: `services/sitemap-services.xml` in `sitemap.xml`/Search Console; owner confirms claims and price ranges.

## (previous) Services polish PR (branch `wip-services-polish`, 2026-10-31 09:05 Africa/Nairobi)
- [x] PR #83 (8 services + 8 guides) is merged and the pages are live on `main`.
- [x] `wip-services-polish` (hub `/services/` now links the 8 pages and guides, `services-extra.json` adds longer sections, violet theme) was checked: both JSON files parse, `node services/build-services.mjs` rebuilds with NO diff, all 9 hub links resolve. PR opened to `main`.
- [ ] NEXT: merge that PR, then open 2 service pages + 1 guide in a browser (not tested in one). Command to re-check: `node services/build-services.mjs && git status --short` (expect empty).
- [ ] STILL OPEN: add `services/sitemap-services.xml` to `sitemap.xml` or Search Console; owner confirms claims (90-day guarantee, low-odour, genuine parts, licensed staff, Kitale in areas) and the price ranges; then the doubled "Buy" check and batch 09.

## (previous) NEWEST: Services SEO pages (branch `wip-services-seo-pages`, 2026-10-31 08:20)
Owner uploaded the Services Blueprint PDF: "Expound on the SEO and blogs, best descriptions of the services in Kenya, use the prices in range, autosave". Full notes: `services/HANDOFF.md` (section on top).
- [x] `services/services-data.json` (8 services + 8 guides, PDF price ranges), `services/build-services.mjs` (tested on a fixture only), `.github/workflows/services-build.yml`.
- [ ] NEXT: run the workflow "Build services pages" on that branch (or `node services/build-services.mjs`), open 2 pages + 1 guide, fix any JSON typo it reports, then merge to `main`.
- [ ] Owner confirms claims (90-day guarantee, low-odour, genuine parts, licensed staff) and the price ranges; link `/services/` to the new pages; add `services/sitemap-services.xml` to Search Console.

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
