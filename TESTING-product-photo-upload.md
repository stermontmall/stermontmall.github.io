# Product photo publishing — Version 6 acceptance criteria

The only current publishing rule is the Neon Version 6 row:
`stermont.public.publishing_rules`, key `publish_products`.
The exact repository mirror is [PUBLISHING_RULES.md](./PUBLISHING_RULES.md).

## Version 6 photo pipeline

1. Add one `file-name|https://source-image-or-product-page` line per product to `data/photo-queue.txt` on `main` (maximum 40 lines).
2. A push to that file triggers `.github/workflows/upload-product-photos.yml`. There is no manual dispatch.
3. Accept JPG, JPEG, PNG, WebP and AVIF images with minimum dimensions of 200 × 200 pixels.
4. Wait for the workflow to finish and read `data/photo-results.json`.
5. Use only `ok=true` entries and their verified ImageKit `browser_url` values. A queue commit alone is not proof of upload.
6. Store the verified URL and source provenance in the matching Neon product record.
7. After the product INSERT transaction commits, separately execute `UPDATE public.products SET active = true, low_at = 50 WHERE id IN (...)` for exactly those inserted product IDs.
8. Re-select the rows and verify active status, stock, low_at, image URL, cost-derived price and audit record before reporting live publication.

Do not use Supabase Storage, the retired `productingest` endpoint, legacy photo-copy scripts, 500 × 500 requirements, GIF acceptance, or manual workflow dispatch. If photo upload or price verification fails, do not publish that product.
