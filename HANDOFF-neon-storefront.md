# HANDOFF: Neon storefront (branch wip-neon-storefront)

Date: 2026-11-23

## Done
- Added `storefront-neon.html`: Kilimall-style storefront (orange header, category sidebar with flyouts, hero banners, department tabs, sub-category grid). Category tree is a snapshot of Neon `public.categories` (93 rows, project restless-shape-79120240, database stermont).
- Page is `noindex` and does not touch `index.html`, generated pages (`p/`, `c/`, `guides/`), sitemaps or workflows.

## Findings
- Neon `public.products` has 0 rows, so `public.storefront_products` is empty. Supabase was deleted (see HANDOFF-remove-supabase.md); no product export was found.

## Next
1. Load products into Neon (needs an export from before Supabase was deleted, or owner approval for a one-time load from product-content.json / p/ pages that bypasses the pricing trigger).
2. Make the page read `public.storefront_products` (Neon Data API) instead of the empty state.
3. When products exist, decide whether to replace `index.html` generation with this layout. Do not edit generated pages directly; change the generators.
