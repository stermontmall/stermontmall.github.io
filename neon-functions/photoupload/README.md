# Stermont Neon product photo upload

Deployed function: `photoupload` on Neon branch `br-fancy-bird-bh01xcbs`.

`POST /upload` accepts multipart form data: `product_code`, `file` or `image_url`, optional `source_url` and `source_name`. It verifies a Neon Auth JWT against `NEON_AUTH_JWKS_URL`, checks `public.admin_profiles` for active owner/admin/editor, uploads to the public-read `product-photos` bucket, and appends the permanent object URL to `public.products.images`. It does not activate or otherwise change the product.

Accepted types: JPEG, PNG, WebP, GIF, AVIF and constrained SVG. Maximum 12 MB. Direct image URLs must be HTTPS and cannot redirect. HEIC/TIFF/BMP conversion is not included yet.

Runtime dependencies: `pg`, `@aws-sdk/client-s3`, `jose`. Neon injects `DATABASE_URL`, `NEON_AUTH_JWKS_URL`, and the branch S3 credentials/endpoint.


Admin page: `/admin-photo-upload.html` (linked from the admin header). The page uses the Managed Neon Auth client to sign in and requests a short-lived JWT; the upload Function validates that JWT with the branch JWKS before checking the admin profile.

Function URL: `https://br-fancy-bird-bh01xcbs-photoupload.compute.c-10.eu-central-1.aws.neon.tech/`. The function deployment is live, but end-to-end HTTP/browser upload testing is still pending because this session's execution environment cannot reach the function hostname.
