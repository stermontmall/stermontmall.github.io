## 2026-11-27 (Africa/Nairobi) - Tools to show how many products Google has indexed (branch `wip-index-status-tools`, NOT merged)

### Question
Owner asked how many products are indexed and for tools that show it.

### Found
- `seo-index-status.mjs` (workflow `seo-index-status.yml`, every 3 hours) already asks Google Search Console about 150 pages per run (products first, rotating through the sitemap). Latest stored report (2026-11-27 01:01): 150 checked, 129 indexed, 21 not indexed. Earlier (2026-11-23): 145 of 150 indexed.
- Bug: `neon-automation-sync.mjs index` read the summary with `[^.]*`, which stops at the full stop in "(rotating batch; ... cycle)." so every row in `public.seo_audits` (source `google-search-console-url-inspection`) stored 0 checked / 0 indexed.
- Gap: only pages reported as NOT indexed were saved per URL in `public.google_index_inspections`, and every run marked all older rows STALE. Indexed pages were never saved, so no total could be counted.
- 639 active products in Neon at the time of writing. No complete total exists until every product URL has been checked at least once (about 150 pages per run, 8 runs a day).

### Done
- Neon (applied directly, additive): function `public.google_index_summary()` - SECURITY DEFINER, admin only (`is_store_admin()`), executable by `authenticated` and the owner role, revoked from public/anonymous. Returns active_products, indexed, not_indexed, never_checked, last_check, by_reason, not_indexed_list (150 max). Verified: a non-admin call is refused. Rollback: `DROP FUNCTION public.google_index_summary();`
- `seo-index-status.mjs`: also writes `index-status.json` (every page checked, indexed or not). Workflow file unchanged.
- `neon-automation-sync.mjs` (index mode): regex fixed (tested on the real 2026-11-27 line: old = no match, new = 150 / 129 / 21); stores every page Google checked in `google_index_inspections` as PASS or FAIL, updated in place per URL; no longer marks every other row STALE.
- `neon-admin.html`: new "Google indexing" card (indexed / not indexed / not checked / live products, % of checked, reasons table, list of products not indexed). Loads on sign in and on Refresh.

### Left
- Not run end to end (no network or Google secrets here). After merge, run the workflow by hand: Actions > Google indexing status > Run workflow, then check `public.google_index_inspections` has PASS rows and the admin card shows numbers.
- Products only count once they have been checked, so "not checked yet" falls over a day or two.
- Existing 33 rows (all not indexed, from one earlier batch) stay as FAIL/STALE until rechecked.

### Decisions
- Counts match products by slug to `https://stermontarcade.co.ke/p/<slug>.html`.
- Merge to main only after one successful workflow run and a look at the admin card.
