# HANDOFF-live

## 2026-11-11 20:05 Africa/Nairobi — 20-product publishing batch

### Done
- Read `CLAUDE.md`, `PUBLISHING.md`, `.claude/commands/post-product.md`, and Supabase `site_playbook` topics `READ_ME_FIRST`, `add_product`, and `add_photo`.
- Confirmed destination: `stermontmall/stermontmall.github.io`, Supabase project `oewvtbnmyombbtggamor`.
- Checked the live catalogue for the proposed VON/Ariete model identifiers; no exact SKU/name duplicates were returned.
- Confirmed the product-photo uploader is active and accepts direct HTTPS image URLs. Do not expose the photo passcode or service-role key.
- Owner's current batch instruction is to apply the same 30% markup used in the immediately preceding batch. Treat this as a batch-specific override; leave the global 15% default unchanged.

### In progress
- Verify the lowest current in-stock Kenyan KES source price for each exact SKU, select a matching direct product image, then create 20 unique rows with cost=source price, price=round(cost*1.30,2), stock=1000, low_at=20, featured=false.
- Attach and verify each image in the public `product-images` bucket before activating each product.
- The existing `add_draft_product` helper still hardcodes 15% and a 600–900-word description. The 2026-11-09 quality gate requires concise, SKU-specific descriptions and says not to pad. Do not use the helper unchanged for this batch; use a one-off validated insert that preserves its duplicate/category/slug checks and the current concise-content rule.

### Next
1. Finish verifying source prices and exact photo URLs for all 20 SKUs.
2. Insert rows as inactive, upload exact photos, and activate only after Storage and `products.images` verification.
3. Verify all 20 rows, shell links, generated product pages, Product JSON-LD, canonical tags and sitemap entries.
4. Trigger `.github/workflows/product-pages.yml` only after the database batch is verified, then record the workflow result.

### Blocked
- No product rows have been created yet. Do not report any item as published or any photo as attached until verified.
