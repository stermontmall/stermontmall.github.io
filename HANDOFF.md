# HANDOFF - fresh product titles/metadata without manual refresh (branch `wip-fresh-product-routing`)

Rule: small steps, commit + push to `wip-<task-name>` after each, update this file with every push, merge to `main` only when finished AND tested.
(The previous SEO/power-words HANDOFF was replaced on this branch; it is still in git history on `main`.)

## What the repo is (decides what can be done)
Static site on GitHub Pages (`CNAME`, `.nojekyll`). No Next.js / React Router / Nuxt, so `force-dynamic`, `revalidate = 0` and `<Link prefetch>` do not exist here.
`p/*.html` and `c/*.html` are generated every 3 h by `generate-products.mjs` (never hand-edit them). Home page cards (`storefront-live.js`) open a client-side product view and `pushState` to `/p/<slug>.html`.

## Done
- [x] `sw.js` -> `stermont-v2`. Network-first; HTML/JSON requests use `cache:'no-cache'` so they are revalidated with the server instead of served from the browser's 10-minute GitHub Pages cache. `skipWaiting()` + `clients.claim()` kept. Only OK same-origin responses are cached; cache is offline fallback only. (commit c633aaf)
- [x] `_headers` with `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`, `Pragma: no-cache`, `Expires: 0` for `/`, `/index.html`, `/p/*`, `/c/*`, `/sw.js`.

## Left
- [ ] `storefront-live.js`: Supabase product fetch with `cache:'no-store'`; set `document.title` + meta description when a product view opens (fresh fetch of the product page's real title/description), restore on close/back (route-change equivalent of `useEffect`).
- [ ] Verify (node syntax check, diff review) and merge to `main`.

## Decisions / limits
- GitHub Pages cannot send custom HTTP headers. `_headers` takes effect only if the site is served from Cloudflare Pages/Netlify. If `stermontarcade.co.ke` is proxied by Cloudflare, create the same headers as a Cloudflare Response Header Transform Rule or Cache Rule (dashboard; not possible from the repo). Until then the service worker is what stops stale pages for returning visitors.
- Next.js items (force-dynamic, prefetch) are not applicable: there is no framework in this repo.
