## 2026-11-19 15:05 (Africa/Nairobi) - PR #970 route checks fixed on wip-fix-shell-routes
- Confirmed: after opening /p/<slug>.html the shell opens (#page-product.open, bottom nav present) and the address is /p/<slug>.html. Only the `pathname == '/'` assertions were wrong.
- Done: 7 assertions in `mobile-shell/shell.test.py` (product + category routes, incl. ?classic=1) now expect the clean /p/ or /c/ address plus the shell view. Local run: 176 PASS; only FAIL left is "no console/page errors", caused by the sandbox network (ERR_TUNNEL_CONNECTION_FAILED), not the code.
- Next: get these commit(s) onto PR #970's branch (`mobile-shell-default-all-routes-2026-11-19`), e.g. `git push origin wip-fix-shell-routes:mobile-shell-default-all-routes-2026-11-19`, then confirm the SEO quality gate goes green. Not merged.

---

