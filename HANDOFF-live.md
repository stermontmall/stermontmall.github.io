## 2026-11-19 15:20 (Africa/Nairobi) - Task start: mobile shell as default WITHOUT a visitor redirect (owner approved, product links must not change)
- Owner goal: shell is the default experience, no Google ranking loss. Product link rule unchanged: `https://stermontarcade.co.ke/?product=<slug>`.
- Context: PR #970 (`mobile-shell-default-all-routes-2026-11-19`) uses `location.replace` from /p/ and /c/ to `/?product=` / `/?cat=` for ALL visitors incl. Googlebot (EARLY script in `seo-shell-chrome.mjs`). `CLAUDE.md`/`PUBLISHING.md`: redirect was removed 2026-11-03 over a suspected ranking drop; needs explicit owner decision (owner now wants shell default, approved a no-redirect approach).
- Plan: build on branch `wip-shell-inplace` (from `wip-fix-shell-routes`); in-place shell on the same /p/ and /c/ address, no navigation; trial on ~20 products first; check Search Console URL Inspection; compare 2-3 weeks before going wide.
- Next: read `mobile-shell/app.js`, `shell-chrome.js`, `seo-shell-chrome.mjs`, `index.html`; decide how to mount the shell in place.

---

## 2026-11-19 15:05 (Africa/Nairobi) - PR #970 route checks fixed on wip-fix-shell-routes
- Confirmed: after opening /p/<slug>.html the shell opens (#page-product.open, bottom nav present) and the address is /p/<slug>.html. Only the `pathname == '/'` assertions were wrong.
- Done: 7 assertions in `mobile-shell/shell.test.py` (product + category routes, incl. ?classic=1) now expect the clean /p/ or /c/ address plus the shell view. Local run: 176 PASS; only FAIL left is "no console/page errors", caused by the sandbox network (ERR_TUNNEL_CONNECTION_FAILED), not the code.
- Next: get these commit(s) onto PR #970's branch (`mobile-shell-default-all-routes-2026-11-19`), e.g. `git push origin wip-fix-shell-routes:mobile-shell-default-all-routes-2026-11-19`, then confirm the SEO quality gate goes green. Not merged.

---

