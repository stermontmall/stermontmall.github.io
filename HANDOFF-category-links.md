# HANDOFF: category direct links + Stermont Cars For Sale (branch wip-category-links)

Owner request 2026-11-09:
1. A separate top-level category "Stermont Cars For Sale", NOT inside Automotive.
2. Every category, when tapped in the shell, must give a direct link to that category.

## Done
- 2026-11-09 (database, already live): Supabase `categories` row id 88 renamed "Stermont Cars For Sale", slug `stermont-cars-for-sale`, moved to top level (parent_id null, sort_order 14, after Automotive). Its 16 cars moved with it. Backup: `categories_backup_20261109b`.
- The generated page `c/stermont-cars-for-sale.html` already exists on main (built after the rename).

## In progress (this branch)
- `category-hubs.mjs`: `cars-for-sale` removed from the Automotive hub kids (cars must not be inside Automotive).
- `mobile-shell/app.js`: tapping a category (chips, Categories tab, drawer) now puts the category's own clean address `/c/<slug>.html` in the address bar (sub-categories use their own slug), like products already do with `/p/<slug>.html`. A phone that opens that address is sent straight back into the same category (existing `/?cat=<slug>` redirect in seo-shell-chrome.mjs). New "share link" button next to the grid title copies or shares the link.
- `index.html`: share button next to `#grid-title`, `app.js?v=19` bumped to `?v=20`.

## Not done yet / next
- Still keyed on the OLD slug `cars-for-sale` (the category now has slug `stermont-cars-for-sale`):
  - `generate-products.mjs`: landing copy entry `'cars-for-sale': { h1: 'Cars for Sale in Kenya', ... }`
  - `seo-meta.mjs`: `catDescription` special case `catSlug === 'cars-for-sale'`
  - `seo-product-extras.mjs`: parent map `'cars-for-sale': 'automotive'` (breadcrumbs still show Automotive for the cars; remove it)
  Rename or remove these, then rebuild pages.
- Tests NOT run (no clone or network in the session that wrote this): `node mobile-shell/navigation.test.mjs`, `python3 mobile-shell/shell.test.py`, `node category-hubs.test.mjs`. Run them before merging.
- Do NOT merge to main until those pass. After merge, rebuild pages with:
  `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`
- Add one line to HANDOFF.md when merged.
