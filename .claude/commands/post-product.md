---
description: Post one owner-supplied product photo and source page as a verified Stermont draft
---

Follow `PUBLISHING.md` exactly; it is the authoritative product-posting workflow. Read `CLAUDE.md` and the Supabase `public.site_playbook` topics `READ_ME_FIRST`, `add_product`, `add_photo`, and `rules`.

For this product, the owner provides the exact source product URL and uploads the actual product photo. Verify that both refer to the same model/variant and pack size. Check for an existing product before creating one. Extract the exact source KES price; source cost is that amount and selling price is `round(source_cost * 1.15, 2)`. Save `cost=source_cost`, `price=selling_price`, `stock=1000`, `low_at=20`. Create as `active=false` while uploading; only set `active=true` after photo and product-row verification succeeds.

Use the authenticated `/admin.html` → AI product photo uploader, entering the URL and selecting the uploaded photo. The Edge Function uploads the binary to the public `product-images` bucket and links it to the product. Do not create the row manually before this flow. Wait for a successful response.

Then query the returned product ID and verify all values and a non-empty `images` array; verify that the image URL opens and depicts the exact product. If any step fails, do not claim success; explain the error and save the blocker to `HANDOFF-live.md`. Do not activate or publish before the image and row verification is complete. Do not reveal secrets or passcodes. Report source cost, selling price, 15% markup, stock/alert, ID, draft status, and verified image URL.
