PHOTO INGESTION ENDPOINT RULE v10 (proposed 2026-11-23, takes effect when the owner merges and deploys it)

Once the `productingest` Neon Function is deployed, the assistant completes the photo transfer by calling `POST /ingest` (ChatGPT Action `ingestProductPhoto`, or an equivalent connector in Claude) instead of trying to upload bytes itself.

- Send product_code, the direct image_url, source_page_url, source_name, rights_basis, rights_evidence, exact_pack_match and alt_text. All v7 and v9 checks (exact brand, product and pack, at least 500 x 500 px, no logos, watermarks, mockups or near-matches, source terms and rights checked) are still done by the assistant BEFORE calling, and the evidence goes in rights_evidence.
- A 201 response is the only proof that a photo is hosted. Never tell the owner a photo is uploaded without it. A 200 duplicate response means the photo was already attached.
- The endpoint changes photos only. It never activates a product. Activation stays in Step 6 and still requires cost, description, SEO, duplicate and regulatory checks (Step 4B for pesticides and veterinary medicines).
- If the endpoint is not reachable or returns an error, do not work around it and do not write vendor hotlinks into images. Leave the product inactive and report the exact error.
- The ingest key is never pasted in chat or stored in the repo or in Neon.
