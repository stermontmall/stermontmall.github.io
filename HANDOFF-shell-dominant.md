# HANDOFF - Shell dominant on phones (2026-11-08, pushed straight to `main` at the owner's request: "mobile shell dominant on my website fully")

## What changed
- `shell-chrome.js` (commit a1beafa): a new first try block. A real visitor on a phone-width screen (innerWidth <= 820) who opens `/p/<slug>.html` goes to `/?product=<slug>` (a `#<size slug>` picks the pack size), and `/c/<slug>.html` goes to `/?cat=<slug>`; `/c/` and `/c/index.html` go to `/?tab=categories`. Uses `location.replace`, so Back does not loop.
- NOT redirected: crawlers and link-preview/speed-test bots (user-agent check: Googlebot, Bing, WhatsApp, Facebook, Telegram, Lighthouse, headless...), desktop-width screens, and any address with `?classic=1` or `?noshell=1` (escape hatch).
- Product links given to the owner by ChatGPT/Claude are already the shell address (`/?product=<slug>`), see PUBLISHING.md "Product links".

## Follow-up 2026-11-08 (16:07 UTC): "it shows the old website first, then the shell"
- Cause: `shell-chrome.js` is loaded with `defer` at the END of `<body>`, so the static page painted before the redirect ran.
- Fix (commit d7399f1, `seo-shell-chrome.mjs`): `/p/` and `/c/` pages get a tiny inline script (marker `<!--stm-early-->`) as the FIRST thing in `<head>`. It runs before anything paints, hides the page and calls `location.replace`. Same rules as above (phone width, not a bot, no `?classic=1`/`?noshell=1`). The block in `shell-chrome.js` stays as a fallback.
- It reaches every page when `product-pages.yml` rebuilds (commit 22f4603 touched `seo-shell-redirect.mjs`, a watched path, to start a rebuild; it also runs every 3 hours). Until that run finishes, pages still have the old late redirect.
- Not run here: `node seo-shell-chrome.test.mjs` (still passes by reading: `addChrome(html)` without the 2nd argument behaves as before).
- To undo the early script: set `EARLY` to `''` in `seo-shell-chrome.mjs`, rebuild, and strip the `<!--stm-early-->` scripts (or leave them; they only act on phones).

## Risk (owner accepted)
This reverses the 2026-11-03 removal (HANDOFF-stop-shell-redirect.md), done over a suspected ranking drop. Crawlers see the static page, visitors get the shell: Google can treat that as a "sneaky redirect", and the shell was slow in Lighthouse (mobile 39/100 on 2026-10-26).
Watch Search Console (Performance clicks; Pages: "Page with redirect", "Crawled - currently not indexed") for 1-2 weeks.

## To undo everything
Delete the SHELL DOMINANT try block in `shell-chrome.js` and set `EARLY = ''` in `seo-shell-chrome.mjs`.

## Left
- [ ] `mobile-shell/shell.test.py` has checks that expect NO redirect on /p/ and /c/ (written 2026-11-03). They will fail on those checks until updated. Run `python3 mobile-shell/shell.test.py`.
- [ ] Check the Actions run "Build product pages" finished, then phone check (private tab): open a plain `/p/<slug>.html` and a `/c/<slug>.html` link: straight to the shell, no static page first. `?classic=1` stays on the static page.
- [ ] Other static pages (about, contact, FAQ, shipping, returns, terms, privacy, track, account, blog, guides) are NOT redirected: they already carry the shell top bar and bottom nav, and are content pages.
