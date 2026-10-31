# HANDOFF-live - newest progress log (read this FIRST, then HANDOFF.md)
Last saved: 2026-10-31 13:05 (Africa/Nairobi), claude.ai chat session with GitHub + Supabase connectors (no clone; sandbox has node for syntax checks only, no network). USAGE LIMIT earlier hit at ~10:25 (resets 14:30).
RULE (owner): after EVERY step rewrite this file in the same minute (Done / In progress / Next / Blocked) so a session cut off by a usage limit can continue on another account. `HANDOFF.md` stays the long history; this file wins where they differ.

## NEWEST (chat, 13:05): ADMIN "Service media" tab (upload photos and videos): backend LIVE, module pushed, NOT yet wired into admin.html, nothing merged
Owner: "What about working on admin to upload photos and videos" then "The service media is not available on admin".
FINDING: the admin had no media tab. In Supabase the public bucket `service-media` already existed (staff-only write, 50 MB, jpeg/png/webp/mp4/webm/quicktime; policies `svcmedia_*`), but the tables `service_posts` and `service_catalog` were NOT live. Commit `83f4c92` on branch `wip-admin-services-cms` (09:41 UTC) has `setup-services-admin.sql` + `services/updates.js` (public feed; no page loads it yet).
### Done
- [x] Supabase migration `service_posts_and_catalog` APPLIED LIVE (about 09:57 UTC, project oewvtbnmyombbtggamor): `public.service_posts` (service_slug, kind update/before_after/completed/tip/offer, title, body, town, media jsonb max 12, published, pinned, created_by) and `public.service_catalog` (slug, active, price_min/max/open/note, headline, notice, cover_url). RLS on both; public reads only published posts / the catalog; staff (`is_staff()`) manage. Tested: anon can read, anon INSERT blocked (rolled back).
- [x] The storage part of `setup-services-admin.sql` was NOT re-run (bucket and staff policies already live). Running that SQL file would only add duplicate policies named "service media staff ...".
- [x] Branch `wip-admin-service-media` (from `main` daf6f3c). Commit `43d0266`: new file `admin-service-media.js` (18,695 bytes). `node --check` OK in the sandbox. It exposes `STMServiceMedia.mount(listEl)`: composer (service, type, title, town, message, up to 12 photos/videos, publish now, pin), photos shrunk in the browser (max 1600 px JPEG), videos up to 50 MB uploaded as they are, files uploaded with `STMAdmin.raw` to `/storage/v1/object/service-media/<service>/<yyyy-mm>/<id>.<ext>`, then a row in `service_posts`; failed saves delete the files again. Post list with Hide/Publish, Pin, Delete (also removes the files).
### NOT done / Next
1. [ ] WIRE INTO `admin.html` (5 small edits; current blob on `main` 5c4ccc2). Do it in a clone (Claude Code): `git checkout wip-admin-service-media`, then
   a) after `<script src="admin-services.js?v=1"></script>` add `<script src="admin-service-media.js?v=1"></script>`;
   b) add `'media'` to `TABS_OK`; c) add `'media'` to `EXTRA`;
   d) in `NAV`, group 'Services', add `['media', '🖼️', 'Service media', 'Upload photos and videos of your work and post them on the service pages']`;
   e) in `render()` before the `if (tab === 'sales' ...` line add: `if (tab === 'media') { if (!window.STMServiceMedia) { L.innerHTML = '<div class="err">The media script did not load. Refresh the page (Ctrl+F5).</div>'; return; } STMServiceMedia.mount(L); return; }`
   Then `node --check admin-service-media.js`, paste the inline script of `admin.html` into a temp .js and `node --check` it, push, open the PR. (A chat session can only overwrite the whole 30 KB admin.html, which is why it was left.)
2. [ ] PUBLIC SIDE: posts only appear on the site once `services/updates.js` (branch `wip-admin-services-cms`, based on an older `main`) is merged or cherry-picked and loaded from `services/page.js` and `services/hub.js`. Not done.
3. [ ] PHONE TEST after wiring: admin > Services > Service media: post one photo and one short video (under 50 MB); they show in the list and open from their public URL; Hide, Pin and Delete work; delete the test post (this also deletes its files).
4. [ ] `service_catalog` (price override, notice, pause bookings, cover photo) has a table but NO admin screen and no public reader yet.
### Facts checked this session (read-only)
- `service_quotes` has 1 row: `SQ-NCK33T`, bed bugs, Nakuru, KES 7,500, status won, staff note present. It looks like a REAL customer: do NOT delete it. So the "delete the test row" step from the 11:55 section has nothing to delete.
- Open PRs: #57 (product title modifiers). Its code is ALREADY on `main` (`seo-meta.mjs` has Top-Quality and the two-word H1, `seo-meta.test.mjs` has the modifier check); merging fails with a conflict in `HANDOFF.md`; it can be closed. A close form was shown in chat, it may not have been submitted. #6 (admin catalog hardening: session renewal + 30 s timeout in `catalog-v10.js`): NOT on `main`, merge fails with a conflict (likely the `admin.html` version line); fix in a clone: `git checkout fix/admin-catalog-load && git merge main`, keep main's admin.html, bump the catalog script version, `node --check catalog-v10.js`, push.

## NEWEST (chat, 12:15): PEST PAGES MERGED to `main` (PR #97, merge 52ed6bf, 09:08 UTC); Pages deploy + services build green. Phone check still open
Owner: "Fix all pending on handoff". `node --check` OK on admin-services.js, services/quote.js, hub.js, page.js, app.js and both inline blocks of admin.html (all merged in PR #96). `wip-services-shell-look` is ALREADY in `main` (PR #93): the compare link main...wip-services-shell-look has nothing to compare.
### Done
- [x] 22 pest pages + index: `services/pests-src/part-1..4.json` (source) -> `node services/build-services.mjs` -> `services/pests/<slug>.html` (888-1,199 words each, index 895), `services/pests/index.html`, `services/pests-data.json` (read by admin "Services overview"), URLs added to `services/sitemap-services.xml`, "Pests we treat" grid added to the pest landing page, hub items for bed bugs / cockroaches / termites / rodents link to their pest page (`services/app.js`, `index.html` loads `app.js?v=2`).
- [x] Pests: bed bugs, cockroaches, termites, rats and mice, ants, fleas and jiggers, ticks, mosquitoes, houseflies and other flies, lice, mites, bees/wasps/hornets, spiders, scorpions, centipedes and millipedes, silverfish, clothes moths, carpet beetles, stored grain pests, snakes (safety only, we do not handle snakes), bats and birds (exclusion only, never harm), locusts and grasshoppers (advice only, swarm control is government).
- [x] Build checks (in the generator, fails the build): no banned words (best, 100%, permanently, guarantee, certified, licensed, non-toxic, eco-friendly, Kitale), every related slug exists, 4+ FAQs each, title <= 70 and description 80-170 characters. Page checks run by hand: JSON-LD parses on all 23 pages, one H1 each, every internal link resolves, no "Kitale". Other service pages are byte-identical to `main` (only the pest landing page, sitemap and word-counts changed).
- [x] `.github/workflows/services-build.yml` now also watches `services/services-more.json` and `services/pests-src/**`.
### FACT CHECK (be honest about it)
- Checked against sources this session: cockroach species and management (UC IPM note), drywood vs subterranean termites (termiteweb.com), FAO larger grain borer manual (control measures list only), Nation article on Kenya locusts (counties named, county teams run spraying; the article gives no farmer reporting steps, so "report to your county agriculture office" is general advice, not quoted from it).
- NOT checked line by line: everything else is standard biology written conservatively (bed bug, flea, tick, mosquito, fly, lice, mite, spider, scorpion, centipede, moth, beetle, snake, bat and bird sections). Search results returned titles only. OWNER or an entomologist should read the 22 pages once. Items worth a second look: "swarms reached dozens of counties in 2020" (locusts), "about 13.5 per cent moisture" for maize, button spiders and baboon spiders in Kenya, scorpion genera, the claim that Aedes mosquitoes breed in clean water.
### Next
1. [x] PR #97 merged at the owner's request (before the phone check). STILL OPEN: owner reads the pages and checks `/services/pests/` and 2 pest pages on a phone (reload twice; service worker). Search Console: submit `services/sitemap-services.xml` (still not in `sitemap.xml`).
2. [ ] Phone test of the quote drawer (see the 11:55 section): one real test quote, then delete the row.
3. [ ] Batch 09 blogs, antenna + electric fence pages (needs a "no price" mode in the generator): see the sections below.

## NEWEST (chat, 11:55): services QUOTE REQUESTS (no payment) + admin portal tabs: CODE COMPLETE on `wip-services-quotes-v2`, PR next, NOT merged
Owner: "Connect github and supabase. Check handoff. Incorporate all services features on my admin portal and fix everything (responsiveness, response). Add an option of placing an order on services like products, but NO payment: ask for a QUOTE; the notification goes to info@stermontarcade.co.ke like product orders. Autosave on handoff. Also include ALL pests (research every variety, not a few), detailed, professional Google SEO. Commit or merge each done task."
NOTE: an earlier Claude Code session made branch `wip-services-quotes-admin` (main + one handoff commit, nothing else). IGNORE it; work is on `wip-services-quotes-v2`, branched from `wip-services-shell-look` (so it builds on the restyled generator). Merge order: `wip-services-shell-look` PR first, then this branch. This branch's own copy of HANDOFF-live.md is OLD (10:25); this file on `main` wins, do not copy the branch one over it.
### Done (all committed and pushed to `wip-services-quotes-v2`, nothing merged to main)
- [x] GitHub (stermontmall/stermontmall.github.io) and Supabase (project oewvtbnmyombbtggamor, eu-west-1, healthy) both connected and working.
- [x] Supabase migration `service_quotes_table` APPLIED LIVE (11:25): table `public.service_quotes` (ref SQ-XXXXXX, service_id, service_name, customer_name, phone +254..., email, county, location, property_type, preferred_date, preferred_slot, details, status new/contacted/quoted/won/lost, quote_amount, staff_notes, handled_by/at), RLS: anon+authenticated INSERT only with status 'new' and no staff fields; staff (`is_staff()`) all; customer reads own. Tested with `set local role anon`; test rows rolled back. SQL: `setup-service-quotes.sql` (cfdaeb5).
- [x] `services/quote.js` (b34fadc, 29 KB): no-payment quote drawer (service picker with 40+ options incl. every pest group, county, town, property type, date, slot, details, name, phone, email; honeypot; 30 s cooldown; dark mode). Inserts into `service_quotes`, then EmailJS to info@stermontarcade.co.ke with the SAME route as product orders (`template_n60yao4`, then `template_cv2qjgm`, then Web3Forms) plus a confirmation email to the customer; WhatsApp button on the success screen; on failure it offers "Send on WhatsApp instead". Takes over `[data-book]` buttons and the `wa.me` quote/book links in the capture phase and only cancels the old behaviour if the drawer really opened. `/services/?quote=1` opens it.
- [x] Loader lines: `services/page.js` (generated pages) and `services/hub.js` (hub, 8aac739; floating button says "Get a quote").
- [x] `admin-services.js` (cdc4fce): tab "Quote requests" (search, status chips with counts, KPIs, quote amount + private staff notes, Save / Contacted / Quoted / Won / Lost / Reopen, WhatsApp / Call / Email buttons, 45 s auto refresh that pauses while typing, `?quote=SQ-..` highlight) and tab "Services overview" (demand by service and county, every service page with Open / Copy link, pest pages list read from `services/pests-data.json` when it exists).
- [x] `admin.html` WIRED (c96dc96, 11:50): script tag, `TABS_OK`, `EXTRA`, NAV group "Services" (📨 Quote requests, 🧰 Services overview), orange badge with the number of NEW quote requests (refreshed every 60 s and on Refresh), `render()` branch, quote timer stops when leaving the tab, `?quote=SQ-XXXXXX` deep link from the staff email (sign in, then it opens that request), sign-out stops the timer.
- [x] FOUND how product orders notify: `checkout-deferred.js` inserts into `orders`, then EmailJS (service `service_zoho`, key `PayiXKhM6gVQLHYAE`; `template_n60yao4` takes `to_email` + `html_body`; fallback `template_cv2qjgm`; last fallback Web3Forms) to `info@stermontarcade.co.ke`. Quotes copy this exactly.
### NOT TESTED (sandbox has no network and no browser)
- `node --check` was NOT run on `admin.html` inline script, `admin-services.js`, `services/quote.js`, `services/hub.js`. Exact command in a clone: `git checkout wip-services-quotes-v2 && for f in admin-services.js services/quote.js services/hub.js services/page.js; do node --check $f; done` and paste the inline script of `admin.html` into a temp .js and check it.
- Nothing opened on a phone. Check list: `/services/` and 2 service pages: tap "Get a quote" (opens the drawer, not WhatsApp); send ONE test request; see it in admin > Services > Quote requests (badge shows 1); email arrives at info@stermontarcade.co.ke with an "Open in admin" button; customer email arrives; mark it Lost and delete the test row in Supabase (`delete from service_quotes where ref = 'SQ-...'`).
### Next
1. [ ] Open PR `wip-services-quotes-v2` -> `main` (needs `wip-services-shell-look` merged first, or retarget). Owner says "Merge" after the phone check.
2. [ ] PESTS (owner: ALL varieties, detailed, professional SEO). Design already assumed by `admin-services.js`: data file `services/pests-data.json` = `{ "pests": [ { "name", "slug", "group", "varieties": [...] } ] }`, pages at `/services/pests/<slug>.html`, JSON-LD (Service + FAQPage + BreadcrumbList), 47-county block, link from the pest landing page and the hub, add to `services/sitemap-services.xml`. Needs a generator change (`services/build-services.mjs`) and a run of `node services/build-services.mjs`, so do it in Claude Code with a clone. Cover at least: bed bugs, cockroaches (German, American, Oriental, Brown-banded, Smokybrown), termites (subterranean, drywood, mound-building), rodents (black rat, Norway rat, house mouse), ants (carpenter, pharaoh, sugar, driver/safari), fleas, ticks, mosquitoes, houseflies and other flies, bees/wasps/hornets, spiders, scorpions, centipedes and millipedes, silverfish, clothes moths, carpet beetles, lice, mites, snakes (exclusion advice only), stored-grain pests (weevils, grain borer, Angoumois moth), bats and birds (proofing), locusts. Facts must be checked against a source; no unverified claims (no "permanently", "100%", licences, job counts). Never the word Kitale.
3. [ ] Owner to confirm: claims (90-day guarantee, low-odour), price ranges, 47-county coverage, that the staff table includes every admin email.
### Blocked / owner
- Nothing blocked. Do NOT merge anything to main without the phone check.

## (previous) services pages get the mobile shell look + two untested commits on main (chat, 10:35)
Owner: "page is boring, not sure it uses the mobile shell ... make it appealing and professionally adopt the mobile shell; automatic save on handoff".
FINDING: nothing under `services/` loaded `shell-chrome.js` on `main`. The hub redesign sits on `wip-services-shell-look` (c066e71) with NO PR merged; the 8 generated service pages and 8 guides had the old plain look.
### Done
- [x] SLIP (this chat committed straight to `main`, not on a `wip-` branch, not tested, not logged at the time). Phone-check both; undo with `git revert <sha>`:
  - `7a29a2f` `site-links.js`: "Services" (/services/) added as the FIRST footer link on every public page (one array item, +28 bytes).
  - `178a424` `services/app.js` (hub): link text now "Read the full service page: prices, areas and FAQs" (was "tenders, cities"); "non-staining" softened to "chosen to be gentle on fabric, wood and walls" (bed bug description, bullet, guide). NOTE: `wip-services-shell-look` has an older `app.js`; on merge keep the `main` wording for those lines.
- [x] GENERATOR RESTYLED on `wip-services-shell-look` (f2533e9) and the bot rebuilt all 8 service pages, 8 guides, guides index and `word-counts.json` (bot commit 11fe3bd, "Build services pages", 07:30 UTC). Build passed (no Kitale, 47 counties). Word counts: services 959-1,292, guides 626-798 (none under 600). New look: violet hero (same as the hub) with price box and WhatsApp quote button, check-mark lists, numbered steps, chevron FAQ accordions, icon tiles for "Other services", floating "Get a quote" button above the shell nav; loads `/shell-chrome.js?v=1` (phone top bar + bottom nav) and `/services/page.js?v=1` (moves the nav highlight from Account to Categories). Copy, JSON-LD, prices and the 47-county block are unchanged. Desktop keeps the plain full page (no shell bars).
  - Checked only by reading the generated `services/guides/index.html` (tags present). NOT opened in a browser by any session.
- [x] `services/page.js` (new, cfc4034) on the same branch.
### In progress
- [ ] PR `wip-services-shell-look` -> `main`: create form shown in chat twice, NOT submitted. Title "Services hub: shell look, illustrated tiles, chooser, steps" (add: "and shell look for generated pages"). Owner says "Merge" after the phone check; merge only when finished AND tested. On merge keep the `main` version of the wording lines in `services/app.js` (see 178a424).
### Next
1. [ ] Phone check from the branch preview or after merge: `/services/`, 2 service pages, 1 guide, guides index (reload twice; service worker). Look for: top bar and bottom nav appear on phone; Categories highlighted; "Get a quote" button sits above the bottom nav and does not hide the last content; dark mode readable; hub booking sheet submit above the nav.
2. [ ] Deep pest pages, antenna + electric fence pages, batch 09 blogs: see the sections below (need node + clone, e.g. Claude Code).
### Blocked / owner
- Owner to confirm claims (90-day guarantee, low-odour, genuine parts, licensed staff), price ranges, 47-county coverage.

## (previous) status of the "Fix all" 4 jobs + services hub redesign
### Done
- [x] JOB 1 CHECKED via GitHub code search on `main`: `p/air-chopper-7-5sc-insecticide-*.html` (4 pages) carry the batch 08 text with unchanged title; Fendona and Navigator pages carry their stored text; code search finds NO "Buy Buy" in `p/`. Supabase `products.description` md5 for Air Chopper rows is identical (bae91e88...). Nothing to fix.
- [x] Supabase check for JOB 2: `description_backup` has batch `pest-batch-09` (5 rows, saved 2026-10-31 04:36 UTC) and the 5 sprayer products already start with the batch-09 text (2-litre hand sprayer, Generic 7L fogger, Jacto HD 550, Greenberg Bronze, Total 20L). Full MD5 compare with `node seo-pest/build.mjs batch-09` NOT done (needs node + clone).
- [x] Services hub redesign pushed to branch `wip-services-shell-look` (commit c066e71): `services/hub.css` (new), `services/hub.js` (new), `services/index.html` (shell-chrome.js on phones, hero panel, "What do you need help with?" chooser, 8 illustrated tiles with the existing price ranges, booking steps, accordion icons, floating Book button, booking sheet z-index 61 above the shell nav z-index 50). JSON-LD, FAQ, form, ids, `app.js` unchanged. `hub.js` passes `node --check`. NOT opened in a browser.
  - Photo slots: tile images load `/services/img/<n>.jpg` and fall back to the drawn icon (names: pest-control, solar, cctv, tv-mounting, agrovet, appliance-repair, deep-cleaning, electrical-plumbing).
### In progress / Blocked
- [ ] PR for `wip-services-shell-look` is NOT created yet (see the section above).
### Next (needs a session WITH node and a clone, e.g. Claude Code; this chat could not run any generator or test)
1. [ ] JOB 2 batch 09: `git checkout wip-seo-batch-09 && node seo-pest/build.test.mjs`; compare MD5 of stored `products.description` for the 5 products with `node seo-pest/build.mjs batch-09` output; write `seo-pest/blogs-09.json` (5 posts, one per product group; 400-600 words; answer 30-60 words; 3+ sections, 2+ question headings; 3-6 FAQ; 2-4 body links incl. `/p/<product>.html`; no KSh prices, doses, "best", "100%", "guarantee", "certified"; related blogs that exist, e.g. `thermal-fogging-machine-what-it-does-and-what-goes-in-it-kenya`, `how-to-read-an-insecticide-label-kenya`, `how-to-disinfect-a-poultry-house-kenya`); then `node seo-pest/blog-build.mjs blogs-09`, `node seo-pest/blog.test.mjs`, PR, merge. Product page files exist for all 5 (checked).
2. [ ] JOB 3 deep pest pages (`wip-services-deep-pest`, plan only): see the list in the section below.
3. [ ] JOB 4 antenna + electric fence pages: see the list in the section below.
Note: `.github/workflows/services-build.yml` only triggers on `services-data.json`, `services-extra.json`, `build-services.mjs`; changes to `services-more.json` or a new `services-deep.json` need "Run workflow" or a trigger path added.

## (previous) "Fix all" = 4 jobs, NONE STARTED (owner picked all four at 09:52; usage limit hit before any work, 2026-10-31 10:25 Africa/Nairobi)
`main` is up to date (PR #90 services 600 words / no Kitale / 47 counties, #91 drawer photos, #92 rail photos all merged). Do these in order; update this file after each.
1. [x] CHECK live product pages (done in the chat session above).
2. [ ] BATCH 09 (Sprayers & Equipment, branch `wip-seo-batch-09`, has `seo-pest/batch-09.json`; descriptions ALREADY in Supabase project `oewvtbnmyombbtggamor`, backup in `description_backup` batch `pest-batch-09`). Do: check out that branch, `node seo-pest/build.test.mjs`, compare MD5 of stored `products.description` with `node seo-pest/build.mjs batch-09` output, write `seo-pest/blogs-09.json` (one post per product group, 400-600 words, avoid "best", "100%", "g/L", "g/kg", "PCPB approved"), `node seo-pest/blog-build.mjs blogs-09`, `node seo-pest/blog.test.mjs`, PR, merge (the blog bot updates `blog/index.html` and `sitemap.xml`).
3. [ ] DEEP PEST PAGES: branch `wip-services-deep-pest` only has a plan. New branch from `main`: `services/services-deep.json` + builder support, pages `bed-bug-control-nairobi` (1,000+ words), `cockroach-control-nairobi`, `termite-control-nairobi`, `rodent-control-nairobi`, `airbnb-short-stay-pest-control-nairobi`; link from the parent page and hub; add to the services sitemap. Use the existing `coverageBlock` (47 counties). Do NOT write unverified claims (licences, "low-odour", heat treatment, "permanently", job counts). Never the word Kitale (build fails on it).
4. [ ] ANTENNA + ELECTRIC FENCE pages: `services/antenna-4g-5g-signal-booster-kenya.html` and `services/electric-fence-installation-kenya.html` (800+ words each). The owner gave NO price range for these, so the builder needs a "no price, quote after a site visit" mode (no price box, no AggregateOffer). Update `services/app.js` so the hub's 4G/5G antenna item and electric fence item link to them.
Tests to run before each merge: `node services/build-services.mjs` (no UNDER 600 WORDS line), `grep -rli kitale services` (only build-services.mjs), and for SEO batches the `seo-pest` tests above. Merge only when tested (owner pattern: PR, then owner says "Merge").
### Still open for the owner
Phone check of `/services/`, 2 service pages, 1 guide, the drawer and the Categories tab photos (open the shop twice); submit `services/sitemap-services.xml` in Search Console; confirm the claims and price ranges, and that all 47 counties are really served.


## NEWEST: Real product photos in the Categories tab left rail (branch `wip-rail-photos`, MERGED as PR #92, merge 1542676, 2026-10-31 10:15 Africa/Nairobi)
Owner: "Switch them to real photos" (the emoji icons in the Categories tab rail; the drawer was done in PR #91).
- [x] `renderCategoriesView()` in `mobile-shell/app.js`: each category row in the rail shows a 44px box with its first real product photo (`photoOf`), emoji fallback. Top Categories (star) and Services keep their emoji. Inline styles only (no tailwind rebuild). `index.html` `app.js?v=12` -> `v=13`. `shell.test.py` = 137/137 (2 new rail checks, fixture data).
- [ ] NEXT: on the phone open the shop twice and open Categories.


## NEWEST: Real product photos in the All categories drawer (branch `wip-drawer-photos`, MERGED as PR #91, merge bed2044, 2026-10-31 10:00 Africa/Nairobi)
Owner (phone screenshot of the drawer): "let the photos used here be real product photos on my website". Cause: `renderDrawer()` in `mobile-shell/app.js` showed the category emoji.
- [x] Each drawer row now shows a 44px box with the first real product photo of that category (`photoOf`, same source as the Categories tab tiles); the emoji stays if the category has no photo or the photo fails. The Services row keeps its tools emoji (it is a page, not a product category). `index.html` `app.js?v=11` -> `v=12`. `shell.test.py` = 135/135 (2 new drawer checks, fixture data).
- [ ] NEXT: on the phone open the shop twice (service worker), open All categories. Not changed: the left rail icons in the Categories tab are still emoji.


## NEWEST: No Kitale, all 47 counties, big cities first (branch `wip-services-600-words`, 2026-10-31 10:05 Africa/Nairobi)
Owner: "remove Kitale from the list but include 47 counties on the services sections; focus mostly on Nairobi and other big cities in Kenya".
### Done (MERGED to `main` as PR #90, 2026-10-31 10:15 Africa/Nairobi, merge 23ce08a)
- [x] Kitale removed from `services-extra.json`, `services-more.json` (text only, no other copy changed). The build still FAILS if the word appears in any generated file. "Our crews are based in Nairobi and Kitale" now reads "Our head office is in Westlands, Nairobi, and we take bookings from all 47 counties".
- [x] `services/build-services.mjs`: one list of 47 counties (Nairobi, then the counties of the big cities, then the rest A to Z; the build fails unless there are exactly 47). Every landing page gets "<service> in all 47 counties" (Nairobi home market, big cities first, travel cost confirmed on WhatsApp, full county list); every guide gets "Where this applies"; JSON-LD `areaServed` lists Nairobi + 46 counties + Kenya.
- [x] `services/index.html` (hub): hero says "Nairobi first, then Mombasa, Kisumu, Nakuru, Eldoret and the other big cities, with bookings from all 47 counties"; hub JSON-LD `areaServed` has the 47 counties.
- [x] `node services/build-services.mjs` ran clean: 19 files, no `UNDER 600 WORDS` line, min 626 words (guide deep-cleaning-checklist), landing pages 948-1,281. All JSON files parse. Generated pages were rebuilt, not hand-edited.
### Next
- [ ] Phone check after the Pages build: open `/services/`, 2 service pages and 1 guide, reload twice (the service worker may cache `services/app.js`). Merged at the owner's request before this check.
- [ ] Optional: `wip-services-deep-pest` (separate bed bug / cockroach / termite / rodent / Airbnb pages) overlaps this branch; decide the order.
### Blocked / owner
- The copy now SAYS services are taken from all 47 counties (Nairobi and big cities first, travel cost confirmed per job). Owner to confirm that is true. Still unconfirmed: the claims (90-day guarantee, low-odour, genuine parts, licensed staff), price ranges, and the compliance documents for tenders (none are claimed).


## (previous) Services copy to 600+ words, tenders, all cities (branch `wip-services-600-words`, 2026-10-31 09:40 Africa/Nairobi)
Owner (after phone screenshots of `/services/`): "add content to all the services, at least 600 words; creative, high-intent words; Nairobi and all cities in Kenya; appeal to organisational tenders; autosave on handoff". Owner chose: hub items LINK to their full pages (not 15 new pages).
FINDING: `services/word-counts.json` on `main` says the 8 landing pages already have 617-912 words, but the 8 guides have 373-543 words, and the hub `/services/` (`services/app.js`, 15 accordion items) showed only about 60 words per item.
### Done (branch pushed, not merged, nothing run)
- [x] `services/services-more.json` (new): per service a "contracts, institutions and tenders" section, a "near me: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and beyond" section and 5 search phrases; per guide 3-4 sections (quotation checklist, tenders, cities, safety). All 8 services and all 8 guides.
- [x] `services/build-services.mjs`: also reads `services-more.json` (after `services-extra.json`) and prints `UNDER 600 WORDS:` for any page below 600.
- [x] `services/app.js`: every hub item now ends with "Read the full service page: prices, tenders, cities and FAQs" linking to its landing page. Map: pest items -> pest-control-fumigation-nairobi; sofa/carpet, move-in/out, post-construction, Airbnb, office janitorial -> deep-cleaning-carpet-wash-nairobi; CCTV and electric fence -> cctv-smart-security-installation-nairobi; inverter -> solar-system-installation-kenya; plumbing and electrical -> electrical-plumbing-maintenance-nairobi; 4G/5G antenna has no landing page, so it links to its guide `#/blog/boost-weak-4g-5g-signal-rural-kenya` on the hub.
### Next (exact commands)
- [ ] RUN: `node services/build-services.mjs && cat services/word-counts.json` (or Actions > "Build services pages" on this branch). Expect no `UNDER 600 WORDS` line. If a guide is still short, add a section for it in `services-more.json` and re-run. Generated pages are NOT edited by hand.
- [ ] Open a PR from `wip-services-600-words` to `main`; merge only after the generator runs clean and 2 pages + 1 guide + the hub links are opened on a phone (reload twice: the service worker may cache `services/app.js`).
- [ ] Optional: a landing page for 4G/5G antenna setup and electric fence (the two hub items without their own page); `services/sitemap-services.xml` is still not in `sitemap.xml` or Search Console.
### Blocked / owner
- Owner to confirm: the claims (90-day guarantee, low-odour, genuine parts, licensed staff), the price ranges, and the SERVICE AREAS. The copy says crews are based in Nairobi and Kitale, and that for every other town the customer sends the location and we confirm how we can help and the travel cost. It does NOT claim we serve every city. Change that sentence if you do.
- TENDERS: the copy does NOT claim any registration or licence (KRA PIN, business registration, NCA, PCPB, AGPO and so on). It says "tell us which compliance documents your tender requires and we confirm what we can supply". Give the real list of documents you hold and they will be added to every page.
- Words kept out on purpose: "best", "100%", "certified", "non-toxic", "eco-friendly", "guaranteed" (outside the 90-day wording).

## (previous) Services in the shop Categories tab (branch `wip-shop-services-categories`, 2026-10-31 09:10 Africa/Nairobi)
PR #86 (drawer link) and PR #87 (Categories tab link, `app.js?v=11`, shell.test.py 133/133) are MERGED. Phone check still open: reload the shop twice and open Categories.
- [ ] STILL OPEN: `services/sitemap-services.xml` in `sitemap.xml`/Search Console; owner confirms claims and price ranges.

## (previous) Services polish PR (branch `wip-services-polish`, 2026-10-31 09:05 Africa/Nairobi)
- [x] PR #83 (8 services + 8 guides) and PR #84 (hub links the 8 pages and guides, `services-extra.json`, violet theme) are merged and live on `main`.
- [ ] Open 2 service pages + 1 guide in a browser (not tested in one). Re-check: `node services/build-services.mjs && git status --short` (expect empty on `main`).

## IN PROGRESS before this (session started 07:45), still open
Owner: "Fix [doubled Buy], and continue with items description and seo and autosave on handoff".
1. [ ] FIX doubled "Buy" on every `/p/` page ("Buy Buy Original <n>" in the extra sections, FAQ, safe-use heading, WhatsApp text). Cause is in the generator side (`seo-product-extras.mjs` / `generate-products.mjs` / `seo-meta.mjs` `buyName`). Branch `wip-fix-double-buy` (not created yet). Fix = strip a leading "Buy " wherever the extras build a sentence around the name. UPDATE: code search finds no "Buy Buy" in `p/` on `main` (2026-10-31), so this looks already fixed.
2. [ ] Batch 09 = Sprayers & Equipment (category slug `sprayers-equipment`): same method as batches 05-08 (facts only from catalog text, back up old text to `description_backup` batch `pest-batch-09` BEFORE writing, MD5 check, blogs-09.json 400-600 words, avoid "best", "100%", "g/L", "g/kg", "PCPB approved").

## Audit 2026-10-31 07:40 (automation check)
- [x] Blog tool works: bot "Update blog index and sitemap" commits 12 s after each merge. All 16 posts of batches 07+08 are in `blog/index.html` and `sitemap.xml`.
- [x] Product pages: batch 07 text is live. Batch 08 pages (e.g. Air Chopper) still showed the OLD text at 07:40; next "Build product pages" run (every 3 h) fixes it. Re-check Air Chopper, Fendona, Navigator. (Re-checked later: live on `main`.)
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
