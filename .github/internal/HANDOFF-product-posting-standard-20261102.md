# Product posting/photo workflow investigation — 2026-11-02

## Completed
- Inspected GitHub repo `stermontmall/stermontmall.github.io` and Supabase project `oewvtbnmyombbtggamor`.
- Confirmed `mobile-shell/app.js` is storefront-only: reads active products and their image URLs; it is not the product publisher.
- Inspected `public.products`: has `images text[]`, `stock`, `low_at`, `cost`, `price`, `active`; current defaults include stock 1000 and low_at 20.
- Inspected `public.site_playbook`, `add_draft_product`, `add_product_photo`, and Edge Functions `upload-photos` and `ai-add-product`. Existing documentation/process had conflicting price formulas and binary photo-transfer limitations.
- Updated `PUBLISHING.md` to standardize new adverts: source price as cost, sell price = round(source price * 1.15, 2), stock 1000, low_at 20, draft-first, actual attachment photo, verify image URL and product page, activate only after verification. This file explicitly blocks claims of success when the session cannot transfer image bytes.
- Updated `CLAUDE.md` to require every Claude session to read `PUBLISHING.md` before product/photo posting and prohibit old 85% / 16% rules absent explicit owner direction.
- Changes committed on main:
  - `PUBLISHING.md`: `00ad640b68cda236ed7e5434dad437455e4c640a`
  - `CLAUDE.md`: `8e5b733fbbe6050aa3476b0a965b5c18cad50969`
- Re-fetched both files to verify the updates are present.
- Read-only Supabase check: 282 total products; 0 active products with an empty image array; 192 active products have stock 1000 and low_at 20.
- Recent November 2 products show several historical formulas (1.15, 1.16 and about 1.353 sell/cost ratio); this confirms the need to make the 15% markup explicit. No historical products were changed.

## Limitation / not yet tested
- No new product/photo was posted in this investigation because the owner has not supplied a new source page and attachment in this task.
- The connected database tools do not themselves transfer a chat attachment's binary bytes into Supabase Storage. The existing URL-based RPC uploader requires a public HTTPS image URL; file transfer requires an environment/tool that can upload the actual attachment or the owner's admin uploader.
- Do not claim that a future attachment is uploaded unless the actual image file reaches Storage/GitHub, its public URL opens, and that URL is saved in `products.images`.
- Need test the full flow with the next owner-supplied webpage + photo in a session with an actual image upload path, then check the generated product page and sitemap after the product-pages workflow.

## Re-run
Read `CLAUDE.md` then `PUBLISHING.md`; use the next owner-supplied product page URL and attached photo. No SQL migration or Edge Function deployment was made.
