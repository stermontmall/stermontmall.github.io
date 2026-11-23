# Deprecated productingest endpoint

This legacy endpoint is not part of the current Stermont Arcade publishing process. Do not deploy or call it for product photos.

The only supported photo workflow is Version 6, documented in the repository root `PUBLISHING_RULES.md`: push `data/photo-queue.txt` to `main`, wait for `.github/workflows/upload-product-photos.yml`, then consume verified `data/photo-results.json` ImageKit URLs.

This folder is retained temporarily for historical reference only. Its previous 500 × 500 image threshold, accepted-format list, and manual ingest-key process are superseded.
