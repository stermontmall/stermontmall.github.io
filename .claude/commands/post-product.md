---
description: Post SterMont Arcade products from the owner's source URL, with the photo when supplied. Enforces minimum 25% markup, stock 1000, low-stock 20, draft status.
---

# /post-product — SterMont Arcade product posting

Follow `CLAUDE.md` and `PUBLISHING.md`. Photos are optional and never block posting.

For every item:
1. Use the owner's exact supplier product-page URL. If a photo is supplied, confirm it matches the same brand, model and pack size.
2. Read Supabase `site_playbook` topics `READ_ME_FIRST`, `add_product`, and `add_photo`. Check for duplicates and a valid category.
3. Create the draft product row. Do not wait for a photo.
4. If a photo was supplied, attach it with the `upload-photos` Edge Function (`product_id` + `image_base64` or direct https `image_url`) or the admin AI photo uploader at `/admin.html`. If this session cannot reach the image bytes, post the draft without it and tell the owner which one step remains.
5. Query the exact product ID and verify price, cost, stock, low_at and active state. If a photo was attached, also open the public image URL.
6. Rules: source KES price = cost; selling price = round(cost * 1.25, 2); stock=1000; low_at=20; active=false pending owner approval; featured=false unless requested. No currency conversion or guessed source facts.
7. Prepare original factual product description and high-intent SEO grounded in the supplier page. Do not invent claims, specifications, certificates, warranties or benefits.
8. Report source price, selling price, product ID, photo status (attached / none yet) and draft status. Save progress in `HANDOFF-live.md`.

Never expose secrets, activate without owner approval, invent a photo URL, or claim a photo is attached without checking Storage and the database reference.
