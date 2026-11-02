---
description: Post SterMont Arcade products with the owner-provided source URL and actual photo. Enforces 15% markup, stock 1000, low-stock 20 and photo verification.
---

# /post-product — SterMont Arcade product posting

Follow `CLAUDE.md` and `PUBLISHING.md` exactly. This command is a workflow checklist, not permission to bypass the authenticated uploader.

For every item:
1. Use the owner's exact supplier product-page URL and actual uploaded product photo. Confirm both refer to the same brand, model and pack size.
2. Read Supabase `site_playbook` topics `READ_ME_FIRST`, `add_product`, and `add_photo`. Check for duplicates and a valid category.
3. Use the authenticated admin page's **AI product photo uploader** (`/admin.html`). The owner must be signed in to staff admin. Select the actual photo file and paste the source URL, then generate the draft. This sends image bytes to `ai-add-product`, which uploads to `product-images` and writes the image URL into the product row.
4. If this Claude session can interact with the signed-in admin uploader and access the attachment bytes, perform that route. Otherwise, clearly tell the owner to complete that one upload step in the admin page; do not pretend chat attachment access is the same as shell file access.
5. Wait for a successful response. Query the exact returned product ID, verify image URL, price, cost, stock, low_at and active state, and open the public image URL. A failed upload means the advert is incomplete.
6. Rules: source KES price = cost; selling price = round(cost * 1.15, 2); stock=1000; low_at=20; active=false pending owner approval; featured=false unless requested. No currency conversion or guessed source facts.
7. Prepare original factual product description and high-intent SEO grounded in the supplier page/photo. Do not invent claims, specifications, certificates, warranties or benefits.
8. Report source price, selling price, product ID, image verification and draft status. Save progress in `HANDOFF-live.md`.

Never expose secrets, insert a product row with no verified image, activate without owner approval, or claim a photo uploaded without verifying Storage and the database reference.
