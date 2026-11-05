# HANDOFF - Shell look on /p/ and /c/ pages (2026-11-05, branch `wip-shell-look-static-pages`, NOT merged)

## Why
Since 2026-11-03 (commit 4d808f6, see HANDOFF-stop-shell-redirect.md) phone visitors are no longer redirected from `/p/` and `/c/` pages into the JS shell, so they see the old static page. Owner (2026-11-05): "I need mobile shell to dominate everything". Chosen approach: restyle the static pages themselves (same page, same URL for everyone, no redirect, no cloaking).

## Done (on the branch)
- [x] `seo-shell-chrome.mjs` (new): after every rebuild, adds the shell top bar + bottom nav to every `p/*.html` and `c/*.html` (adds `<script src="/shell-chrome.js?v=2" defer>` and a small `<style>` that reserves the 52px bar height and lifts the sticky buy bar above the bottom nav). Idempotent (marker `<!--stm-chrome-->`), meta-refresh stubs untouched.
- [x] `seo-shell-chrome.test.mjs` (new): ran locally with node, passes.
- [x] `shell-chrome.js`: no tab is marked current on `/p/` and `/c/` pages.

## Blocked
- [ ] Workflow file could not be edited from here (GitHub connector returned "Forbidden" for `.github/workflows/product-pages.yml`). Owner must make these 3 edits to `.github/workflows/product-pages.yml` (on this branch or on `main` after merge):
  1. Under `on.push.paths` add: `- 'seo-shell-chrome.mjs'` and `- 'shell-chrome.js'`
  2. After the step "Test hand-written product content" add:
     ```yaml
           - name: Test the shell top bar and bottom nav injector
             run: node seo-shell-chrome.test.mjs
     ```
  3. After the step that runs `node seo-shell-redirect.mjs` add:
     ```yaml
           - name: Give product and category pages the shell top bar and bottom nav, same page for everyone (seo-shell-chrome.mjs)
             continue-on-error: true
             run: node seo-shell-chrome.mjs
     ```

## Next
- [ ] Apply the 3 workflow edits, merge the branch to `main`, then run the "Build product pages" workflow (Actions tab, Run workflow). The bot commit will add the bar to all `p/` and `c/` pages.
- [ ] Phone check in a private tab: `/p/` and `/c/` pages show the purple-free white top bar (back, search, cart) and the bottom nav (Home, Categories, Deals, Cart, Account); the green sticky buy bar sits above the nav.
- [ ] Not run here: `python3 mobile-shell/shell.test.py` (no clone), and the full build.
- [ ] Not covered yet: `/guides/` pages, `/blog/` and `products.html` (not in `p/` or `c/`).
- [ ] To undo: remove the workflow step; pages lose the bar on the next rebuild.
