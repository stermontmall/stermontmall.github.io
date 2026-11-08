# HANDOFF - Shell dominant on phones (2026-11-08, pushed straight to `main` at the owner's request: "mobile shell dominant on my website fully")

## What changed
- `shell-chrome.js` (commit a1beafa): a new first try block. A real visitor on a phone-width screen (innerWidth <= 820) who opens `/p/<slug>.html` goes to `/?product=<slug>` (a `#<size slug>` picks the pack size), and `/c/<slug>.html` goes to `/?cat=<slug>`; `/c/` and `/c/index.html` go to `/?tab=categories`. Uses `location.replace`, so Back does not loop.
- NOT redirected: crawlers and link-preview/speed-test bots (user-agent check: Googlebot, Bing, WhatsApp, Facebook, Telegram, Lighthouse, headless...), desktop-width screens, and any address with `?classic=1` or `?noshell=1` (escape hatch).
- Product links given to the owner by ChatGPT/Claude are already the shell address (`/?product=<slug>`), see PUBLISHING.md "Product links".
- The generator was not touched: `seo-shell-redirect.mjs` still only strips old redirect scripts, and `seo-shell-chrome.mjs` still puts `shell-chrome.js` on every /p/ and /c/ page, so rebuilt pages keep the behaviour.

## Risk (owner accepted)
This reverses the 2026-11-03 removal (HANDOFF-stop-shell-redirect.md), done over a suspected ranking drop. Crawlers see the static page, visitors get the shell: Google can treat that as a "sneaky redirect", and the shell was slow in Lighthouse (mobile 39/100 on 2026-10-26).
Watch Search Console (Performance clicks; Pages: "Page with redirect", "Crawled - currently not indexed") for 1-2 weeks.

## To undo
Delete the first `try { ... } catch (e) {}` block in `shell-chrome.js` (the one commented SHELL DOMINANT). Nothing else needs changing.

## Left
- [ ] `mobile-shell/shell.test.py` has checks that expect NO redirect on /p/ and /c/ (written 2026-11-03). They will fail on those checks until updated. Run `python3 mobile-shell/shell.test.py`.
- [ ] Phone check (private tab): open a plain `/p/<slug>.html` and a `/c/<slug>.html` link: both land in the shell. Add `?classic=1`: stays on the static page.
- [ ] Other static pages (about, contact, FAQ, shipping, returns, terms, privacy, track, account, blog, guides) are NOT redirected: they already carry the shell top bar and bottom nav, and are content pages.
