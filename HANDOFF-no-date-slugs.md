# HANDOFF - No date stamps in product links (2026-11-08, branch `wip-no-date-slugs`, NOT merged)

## Why
Owner shared a review of `/p/3m-6700-full-face-respirator-20261108.html`: a date stamp at the end of a permanent product URL reads as temporary content and weakens ranking. Fix it permanently: clean the existing links and stop new ones.

## Cause
`products.id` is chosen by whoever posts the product, and the insert trigger forces `slug := id`. Page address = `/p/<slug>.html`. Posting sessions appended `-20261108` to the id, so 100 products (all created 2026-11-08, 16:32 to 18:19 UTC, so almost certainly not indexed yet) got dated links. Nothing in the database functions adds dates; it was an id naming habit.

## Done in Supabase (project oewvtbnmyombbtggamor)
- [x] Backup: `products_slug_backup_20261108` (id, old slug for the 100 products).
- [x] `products.slug` for those 100 products: the `-20261108` suffix removed (e.g. `3m-6700-full-face-respirator`). Pre-checked: no clash with any existing id, slug or redirect, no duplicates inside the batch. `products.id` is UNCHANGED (it is the real key for cart, orders and stock).
- [x] The 100 old dated slugs were inserted in `product_slug_redirects` (old_slug -> product_id), so old links keep forwarding. (The trigger `trg_log_product_slug_change` skips rows where old slug = id, so these were inserted by hand.)
- [x] Guard: trigger `products_no_date_stamp_trg` (function `guard_product_no_date_stamp`) rejects any new id, and any slug change, that ENDS in a date. Widened later the same day to: `-20261108`, `-202611`, `-2026-11`, `-2026-11-08`, `-08-11-2026`, `-nov8`, `-8-nov-2026`, `-november-2026`. Tested on 20 sample slugs; ordinary words and models (kitchen-decor, permanent-marker, junior-bike, samsung-galaxy-a15, hp-laptop-2024, march-pump) are NOT blocked. A bare year such as `-2024` is allowed on purpose. No existing product id or slug matches, so updates to current products are never blocked. Existing dated ids are not checked on update.
- [x] `site_playbook` topics `add_product` and `rules` now carry the rule (backup: `site_playbook_backup_20261108c`).
- Rollback of slugs: `update products p set slug = b.slug from products_slug_backup_20261108 b where p.id = b.id;` then delete the 100 matching rows from `product_slug_redirects` (old_slug = b.slug). To drop the guard: `drop trigger products_no_date_stamp_trg on public.products;`

## Done in the repo (this branch)
- [x] `CLAUDE.md` rule 7 (no date stamps in ids/slugs).

## Left
- [ ] Rebuild the product pages so the clean addresses exist and the old dated addresses become forwarding pages. Owner runs it from https://github.com/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml (Run workflow, branch main), or: `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main` (never edit the workflow file). Rebuild reads the DB, so it does not need this branch merged.
- [ ] After the rebuild, check: `/p/3m-6700-full-face-respirator.html` opens; the old `/p/3m-6700-full-face-respirator-20261108.html` forwards to it; `https://stermontarcade.co.ke/?product=3m-6700-full-face-respirator` opens the shell product page (the shell also still resolves old dated ids). Sitemaps should list only the clean addresses, with canonical pointing at the clean address.
- [ ] Merge this branch (note-only change) once the checks pass.
- [ ] Optional: `/post-product` command text and `PUBLISHING.md` may still show a dated id example; search for `yyyymmdd` / `20261108` and remove it.
- Remaining dated ids (100 products keep a dated `id`, invisible to visitors). Left on purpose: renaming ids would touch orders, stock and carts.

## Ranking notes
- The renamed products were created the same day (about 2 hours before the rename), so Google has most likely not indexed their dated addresses. Nothing established is being moved.
- GitHub Pages cannot send 301 redirects (see `HANDOFF-clean-product-links.md`), so the old dated address becomes a forwarding page, not a true 301. That is acceptable only because these addresses are new. Never rename the slug of an already-indexed product without the owner asking.
- Watch Search Console for a week: URL Inspection on one renamed product should show the clean address as the Google-selected canonical.
