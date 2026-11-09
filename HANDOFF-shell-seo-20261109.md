# HANDOFF - Shell redirect SEO + stale tests (2026-11-09, branch `wip-shell-early-redirect-test`, NOT merged)

Owner: "proceed with the SEO on the shell design"; chose "Shell redirect SEO and stale tests" first. GitHub + Supabase connected; no clone and no network in the sandbox, so only node-only checks could be run.

## Findings (read from `main` 7b80a7f)
- [x] Clean links are DONE on `main`: `mobile-shell/app.js` `productUrl()` gives `/p/<slug>.html` (+ `#<size slug>`), no `?shell=1`; old `?shell=1` links still open the shell. `HANDOFF-clean-product-links.md` still says "NOT merged": that note is out of date.
- [x] `shell.test.py` share checks already expect the clean link. The "home page keeps the SEO head" check should pass: title `Stermont Arcade | Pest Control & Online Shopping Kenya` (54 chars), canonical `/`, `index, follow`, 2 JSON-LD blocks, seo-links markers present. Not run here.
- [!] MISLEADING TESTS in `mobile-shell/shell.test.py`: the "redirect removed: a phone ... stays on that page" and "category redirect removed" checks (labels date from 2026-11-03) describe a policy that no longer exists. Generated `/p/` and `/c/` pages now carry the inline `<!--stm-early-->` phone redirect. Those checks still pass only because Playwright's default user agent contains "HeadlessChrome", which the redirect treats as a bot. They prove nothing about phones. Not edited (the file is ~33 KB and cannot be patched through the GitHub tool); rename/replace them when a clone is available.
- [x] Broken link cause: `guides/cheapest-cars-for-sale-kenya.html` links `/c/cars-for-sale.html`, but the category page that exists is `/c/stermont-cars-for-sale.html`. Fix the slug in whatever generates that guide (not the guide file).
- Home page `View all 698 products` is stale (752 active in Supabase); the bot rewrites that block, so check the generator count only if it matters.

## Done on this branch
- [x] `seo-shell-early.test.mjs` (new, 58 checks, run in a scratch copy with node 22: OK, 0 violations). It runs the REAL inline script from `p/abasi-5-ec.html` in a fake browser (node:vm) and checks: phone 390/412/820 px -> `/?product=<slug or size slug>`, `/c/<slug>.html` -> `/?cat=<slug>`, `/c/` -> `/?tab=categories`; old `?shell=1` at any width; `?classic=1` / `?noshell=1` opt out; Googlebot, Google-InspectionTool, bingbot, WhatsApp, Facebook, Telegram, Lighthouse and HeadlessChrome are never redirected or hidden (mobile and desktop width, with and without `?shell=1`); unsafe hash, nested path and other pages untouched; no page in `p/` or `c/` carries an OLD variant of the script.
- NOT run against the real repo files (only the sample page was available): the last two checks read every `p/*.html` and `c/*.html`. Run `node seo-shell-early.test.mjs` in a clone first.

## Ranking risk (unchanged, owner-accepted 2026-11-08)
- Crawlers and preview bots get the static page; real phones are sent to the shell. Same content, canonical points at the clean `/p/<slug>.html`, but Google can still read "bots and visitors see different pages" as a sneaky redirect. If Search Console shows a drop in Indexed or Page-with-redirect for `/p/` URLs, delete `EARLY` in `seo-shell-chrome.mjs` and the block in `shell-chrome.js`, then rebuild.

## Left
- [ ] In a clone: `node seo-shell-early.test.mjs`, then add it to `seo-pr-quality.yml` (workflow files were not touched), then merge to `main`.
- [ ] Rewrite the "redirect removed" checks in `shell.test.py` to use a real phone user agent and expect the shell, or delete them.
- [ ] Fix the `/c/cars-for-sale.html` slug in the guide generator.
- [ ] Owner phone check (private tab): open a plain `/p/<slug>.html` on a phone: lands in the shell product view, address bar shows `/p/<slug>.html`.
