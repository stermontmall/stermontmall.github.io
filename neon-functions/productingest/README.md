# Stermont product photo ingestion (`productingest`)

This is the missing piece of the publish-products rule (v9): a server-side endpoint that actually moves the image bytes into Stermont's permanent `product-photos` bucket. A ChatGPT or Claude session cannot do that itself, because it can only create upload links.

## Routes

- `GET /health`: process health only.
- `POST /ingest` (JSON, `Authorization: Bearer <ingest key>`):

```json
{
  "product_code": "STM-000123",
  "image_url": "https://supplier.example/photos/product.jpg",
  "source_page_url": "https://supplier.example/product/123",
  "source_name": "Supplier name",
  "rights_basis": "kenyan_vendor",
  "rights_evidence": "Checked the site terms on 2026-11-23; reseller use allowed",
  "exact_pack_match": "Label shows brand X, 250 ml bottle",
  "alt_text": "Brand X insecticide 250 ml bottle",
  "main": true
}
```

`rights_basis` is one of `manufacturer`, `authorized_distributor`, `kenyan_vendor`, `licensed`, `own`. `rights_evidence` (at least 15 characters) is required for everything except `manufacturer` and `own`.

## What it does

1. Checks the ingest key (only its SHA-256 is stored).
2. Downloads the image on the server. Public HTTPS only, private addresses blocked, up to 3 redirects, each re-checked, 12 MB maximum.
3. Decides the format from the real file bytes (JPEG, PNG, WebP, GIF) and requires at least 500 x 500 px.
4. Skips exact duplicates (same SHA-256 already on the product).
5. Stores the file in `product-photos`, reads the stored object back, and requests its public URL. If any check fails, the product is not changed.
6. Adds the stable URL to `images`, sets `alt_text`, records full provenance in `attributes.photo_provenance` and `attributes.photo_source`, and writes an `admin_audit_log` row.

It never changes `active`, `price`, `stock`, `slug` or `product_code`. Activation stays in the publish rule (Step 6), after the cost, description, SEO, duplicate and regulatory checks.

## Not included

HEIC, TIFF, BMP, AVIF and SVG conversion. Those formats are rejected with a clear error. The rights and terms check on the source site is still done by the assistant, which must pass its evidence in `rights_evidence`.

## Deploy (owner does this once)

1. Make an ingest key and its hash on your own computer. Do not paste the key into chat or the repo:
   ```bash
   KEY=$(openssl rand -hex 32)
   printf '%s' "$KEY" | sha256sum
   ```
2. Deploy with the hash as `INGEST_KEY_SHA256`:
   ```bash
   npm install --prefix neon-functions/productingest
   neon functions deploy productingest --src neon-functions/productingest
   neon functions get productingest
   ```
   Set the environment variable `INGEST_KEY_SHA256` to the hash printed in step 1.
3. Give the key itself only to the ChatGPT Custom GPT Action (Bearer auth) or to the assistant's secure connector settings.
4. Replace `REPLACE_AFTER_DEPLOY` in `chatgpt-product-ingest-openapi.json` with the function URL from `neon functions get productingest`.

## Seed the rule into Neon

```bash
DATABASE_URL=... node scripts/seed-publishing-rule.mjs
```

This loads `publish_products` into `public.publishing_rules` from `PUBLISH-PRODUCTS-RULE.md` plus `PUBLISH-PRODUCTS-INGEST-ADDENDUM.md`.

## Known limits

- DNS is checked before each download. A hostile DNS server could in theory change its answer between the check and the download. The risk is low because only the owner's assistant holds the key.
- Not tested against live Neon yet. Deploy, then run one real ingest on a draft product before relying on it.
