---
description: Publish Stermont Arcade products using the single canonical Neon Version 8 rule.
---

# /post-product — Stermont Arcade product publishing

Before any product discovery, photo ingestion, insertion, activation, or publication:

1. Fetch the live rule from Neon project `restless-shape-79120240`, database `stermont`:
   `SELECT content FROM public.publishing_rules WHERE key = 'publish_products';`
2. If Neon is unavailable, read the exact mirror in the repository root: `PUBLISHING_RULES.md`.
3. Follow Version 8 end-to-end (section 12 is the default workflow), including the `data/photo-queue.txt` push-triggered ImageKit pipeline, minimum 200×200 image dimensions, JPG/JPEG/PNG/WebP/AVIF support, verified `data/photo-results.json` browser URLs, and the separate post-insert activation UPDATE.
4. Do not follow superseded publishing, pricing, photo, upload, or activation instructions. Never use Supabase for product publishing.
5. Never claim a product is live until its inserted row has been activated and re-selected to verify all required Version 8 checks.

The Neon row is the source of truth. `PUBLISHING_RULES.md` is its exact repository mirror.
