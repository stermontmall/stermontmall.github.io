# Stermont Neon product photo upload

Function: `photoupload` on Neon branch `br-fancy-bird-bh01xcbs`.

## Routes

- `GET /health` — process health only; it does not prove database, auth, or storage connectivity.
- `POST /upload` — multipart form data: `product_code`, either `file` or `image_url`, optional `source_url` and `source_name`.

The handler verifies a Neon Auth JWT against `NEON_AUTH_JWKS_URL`, checks `public.admin_profiles` for an active owner/admin/editor, uploads bytes to the public-read `product-photos` bucket, and appends the resulting URL to `public.products.images`. It does not activate or reprice the product.

## Dependencies and deployment

Install the dependencies in this directory before deploying:

```bash
npm install --prefix neon-functions/photoupload
neon functions deploy photoupload --src neon-functions/photoupload
neon functions get photoupload
```

The Neon Functions deployment API expects a bundled function. Uploading the entrypoint without resolving its npm dependencies causes a runtime import failure. The current live deployment was checked on 2026-11-22: deployment **4** is `completed` on Node.js 24. The `/health` route confirms that the process starts, but does not prove an authenticated upload or Object Storage write.

Neon injects `DATABASE_URL`, `NEON_AUTH_JWKS_URL`, and the branch Object Storage credentials/endpoint at runtime.

## Image constraints

Accepted: JPEG, PNG, WebP, GIF, AVIF and constrained SVG. Maximum 12 MB. Direct image URLs must be HTTPS and cannot redirect. HEIC/TIFF/BMP conversion is not implemented. The uploader only stores supplied image bytes; it does not grant rights to vendor images. Check vendor permissions and record the source page before upload.

## Browser integration

Admin page: `/admin-photo-upload.html` (linked from the admin header). It uses Managed Neon Auth to sign in and sends a short-lived JWT to the Function.

Function URL: `https://br-fancy-bird-bh01xcbs-photoupload.compute.c-10.eu-central-1.aws.neon.tech/`.

End-to-end browser upload remains unverified. The `product-photos` bucket was checked on 2026-11-22 and contained zero objects. The admin uploader page is introduced by PR #1045 and becomes available on the public site only after that PR is merged and deployed. Verify sign-in, one real authorized upload, public object GET, and the matching `products.images` row before treating the photo pipeline as operational.
