# HANDOFF-live

## 2026-11-11 20:05–20:15 Africa/Nairobi — 20-product publishing batch

### Done
- Read `CLAUDE.md`, `PUBLISHING.md`, `.claude/commands/post-product.md`, and Supabase `site_playbook` topics `READ_ME_FIRST`, `add_product`, and `add_photo`.
- Confirmed destination: `stermontmall/stermontmall.github.io`, Supabase project `oewvtbnmyombbtggamor`.
- Checked the live catalogue for the proposed SKU/model identifiers; no exact SKU/name duplicates were returned.
- Created 20 unique product rows in `public.products`, all currently `active=false`, `images=[]`, stock 1,000, low_at 20, featured false.
- Applied the owner's batch-specific 30% markup: price = round(source KES cost × 1.30, 2). Total source cost recorded: KSh 113,463.00; total planned selling value: KSh 147,501.90.
- Used concise, item-specific descriptions in line with the 2026-11-09 reset quality gate; did not pad descriptions to meet the stale 600–900-word helper check.
- Confirmed the product-photo uploader is active and accepts direct HTTPS image URLs. Do not expose the photo passcode or service-role key.

### In progress
- Attach the exact product photo for each row through `public.add_product_photo`; activate only when upload succeeds.
- Verify each Storage object and `products.images` entry, then check all 20 rows and mobile-shell links.
- Verify generated product pages, Product JSON-LD, canonicals and sitemap entries after the product-pages workflow completes.

### Next
1. Upload the 20 selected direct image URLs; retry any failed source with another exact image.
2. Verify `active=true`, one or more image URLs, source cost, 30% selling price, stock and alert threshold for all 20.
3. Trigger `.github/workflows/product-pages.yml` only after database/photo verification, then verify the live pages.
4. Record the source price pages and photo sources for the batch in this handoff.

### Blocked
- All 20 rows are still inactive pending verified photo uploads. Do not report any item as published or any photo as attached until Storage and `products.images` are checked.
