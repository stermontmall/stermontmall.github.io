---
description: Publish verified SterMont Arcade products using the live Supabase product-photo uploader. Requires exact product photos, current Kenyan pricing, 15% markup, stock 1000 and low-stock 20.
---

# /post-product — SterMont Arcade product posting

Follow `CLAUDE.md`, `PUBLISHING.md` and the current Supabase `site_playbook`. The canonical rules in `PUBLISHING.md` take precedence over this checklist.

For every item:

1. Read `HANDOFF-live.md` first, then `PUBLISHING.md` and the Supabase playbook topics `READ_ME_FIRST`, `add_product` and `add_photo`.
2. Check the full live catalogue for duplicates. Confirm the exact category, brand, model, variant and pack size.
3. Verify the lowest current in-stock KES price for the exact product from a reputable Kenyan seller/supplier. Record the source URL. If there is no exact KES price, do not invent one or create a priced listing.
4. Create the product row with the approved `add_draft_product` helper and factual SEO description. Use the verified source KES price as cost; default 15% markup; stock 1000; low_at 20; featured false unless requested. Respect the existing charm-price trigger. Descriptions must follow the current playbook (600–900 words (the database helper accepts 40–2,000; never pad); no padding).
5. **Photo is mandatory for publication.** First find the exact product packshot on the manufacturer, supplier or official retailer page. Prefer a sharp image at least 450×450 showing the same brand, model/part number, colour and pack size. Do not use vendor logos, banners, generic category images, unrelated variants or watermarked images.
6. **Use the deployed Supabase `upload-photos` function (v14):**
   - Preferred: send the public HTTPS supplier/product-page URL as JSON `{product_id, image_url}`. The function automatically inspects up to four page image candidates (Open Graph, Twitter image, `image_src`, image metadata and Product JSON-LD) and downloads a valid image.
   - If page extraction fails, send the exact direct HTTPS image URL in `image_url`.
   - If the host blocks downloads, fetch the exact image bytes and send `image_base64`, or use multipart `files`.
   - For multiple images, send `images:[...]`; use `append:true` to add gallery photos without replacing the main image.
   - The function stores files in public Storage bucket `product-images` and updates `products.images`.
   - Never expose the passcode, service-role key or other secrets. Do not put secrets in code, SQL output, handoff notes or chat.
7. The uploader validates the file format/bytes; it does NOT verify what the image depicts. Check the upload response, confirm the Storage object exists, confirm the exact URL is in `products.images`, then open and visually inspect the **final stored public Storage URL**. Confirm it shows the exact product and pack. If the final stored image cannot be opened or visually checked, keep the product inactive and record the blocker.
8. Only after exact source price and final-image visual QA pass, publish the product (`active=true`). You may use the uploader's `activate:true` option only after image QA; safer default is upload inactive, inspect, then activate. Verify the row and `public.get_store_catalog()` return the active product.
9. Check the actual stored price, cost, stock, low_at, images and active state. Verify the mobile-shell product link: `https://stermontarcade.co.ke/?product=<slug>`.
10. Save progress in `HANDOFF-live.md` after each meaningful step. Report only what was actually verified; never claim an item is live if it is still inactive or absent from the public catalogue.

## Hard stops

- No exact product photo, failed upload, unopenable final Storage image, wrong pack/model, missing exact KES source price, duplicate, or failed public-catalogue check = do not publish.
- Never silently substitute a generic or similar product photo.
- Never tell the owner to upload a screenshot as the normal photo-upload workflow. Use supplier-page extraction, direct image URLs or image bytes first; ask for a screenshot only as a last-resort visual QA fallback.


Owner master prompt update (2026-11-14): source cost is the exact in-stock Kenyan retail price; selling price is exactly `round(cost * 1.15, 2)`. Do not add charm-price markup. Descriptions must be 600–900 original factual words; skip thin-fact products rather than pad. The page generator builds the meta description from the first factual sentence of the product description (max 155 characters); make it concise and unique. No dedicated `meta_description` column exists; do not invent one.
