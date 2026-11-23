
STERMONT ARCADE — FULLY AUTONOMOUS PRODUCT DISCOVERY & LIVE PUBLISHING
PERMANENT STANDING INSTRUCTION — NEON PUBLISHING RULES VERSION 6 (PHOTO QUEUE PIPELINE)

CRITICAL EXECUTION MANDATE (NO STOPPING / NO QUESTIONS):
- NEVER stop mid-batch to ask the user questions, request confirmation, or halt over minor technical barriers.
- Execute the entire pipeline end-to-end until all target products are inserted, verified, and published live (active = true) in Neon.
- If a single vendor URL, image link, or API call fails or blocks access, DO NOT halt the batch—immediately pivot to an alternate Kenyan vendor source, mirror image, or fallback method and keep moving.

1. SOURCE OF TRUTH
- Neon project: "restless-shape-79120240" | Database: "stermont" | Schema: "public" | Table: "public.products"
- Never use Supabase to publish products.

2. AUTONOMOUS PRODUCT DISCOVERY (TARGET: 30-40 PRODUCTS PER RUN)
- Discover top-selling, in-stock products in the requested category from established Kenyan websites ranking on Google Kenya: Agropests, AgriGuard Agrovet, ProCapital, Jumia Kenya, Kilimall, Cheap Deals, Mkulima Young, and major Kenyan agrovet/hardware distributors.
- One pack size = one separate product record.
- Save commercial demand evidence in attributes.demand_note.

3. FAST DUPLICATE CHECK
- Check Neon public.products, GitHub sitemap-products.xml, and GitHub product-names.json.
- Skip exact duplicates or identical pack sizes; never delete existing records.

4. VERIFIED PRICING & NEON 4-TIER MARKUP
- Find the lowest verified, current, in-stock Kenyan retail/distributor price for the exact brand and pack size. If one site is out of stock or hides prices, immediately check the next Kenyan retailer.
- Save baseline_cost, source_url, source_website, and date_researched.
- Insert baseline_cost only so Neon's price_4tier(cost) trigger calculates the selling price (<20k: +30%, 20k-39,999: +25%, 40k-60k: +20%, >60k: +17.5%, min 15% margin, rounded to nearest KSh 50, min price KSh 200).

5. VERSION 6 IMAGEKIT PHOTO PIPELINE
- Source genuine, clear product photos matching the exact brand, product, and pack size from reliable manufacturers, distributors, or trusted Kenyan e-commerce sites (Jumia, Kilimall, Agropests, AgriGuard, ProCapital, etc.).
- Accept genuine JPG, JPEG, PNG, WebP and AVIF source images. Non-JPEG source URLs are allowed; do not reject a source merely because its URL extension or source format is not .jpg. The uploader validates source dimensions and ensures the normalized JPEG output is at least 200 x 200 pixels.
- AUTOMATIC MIME VALIDATION + JPEG NORMALIZATION: The GitHub Action .github/workflows/upload-product-photos.yml installs sharp and runs scripts/upload-product-photos-to-imagekit.mjs. The uploader downloads each candidate with a browser User-Agent and Accept: image/*, checks the HTTP response and image/* Content-Type (rejecting text/html and other non-image responses), decodes/validates the actual image bytes with sharp, and converts every supported valid raster source (JPG, JPEG, PNG, WebP, AVIF) to a standard .jpg JPEG binary before uploading to ImageKit. It verifies the uploaded ImageKit browser_url returns HTTP 200 and image/jpeg. Never reject a valid image only because the source is not JPEG; never manually convert files. If a source is blocked, returns HTML, is corrupt, or fails the minimum image checks, automatically try another image candidate/vendor URL.
- This conversion is automatic in the GitHub uploader; operators must not perform manual format conversion.
- Primary Upload Path: Commit one "file-name|https://image-url" line per product to GitHub data/photo-queue.txt on main. This push triggers .github/workflows/upload-product-photos.yml. Read data/photo-results.json after the workflow completes and use only successful, verified ImageKit browser_url values.
- Source fallback: If an image URL is blocked, returns HTML, is corrupt, or fails image validation, immediately try an alternate image candidate/vendor URL and re-dispatch. The GitHub uploader performs MIME validation and JPEG conversion automatically; never convert files manually.
- Store the verified HTTPS browser_url from ImageKit in Neon's images field alongside alt_text, source_page, and retrieval_date.

6. SEO & 600-800 WORD PRODUCT DESCRIPTIONS
- Write original 600-800 word descriptions with bold headings, short paragraphs, verified specs, Kenyan usage/buying guidance, pack-size advice, internal links (/c/pest-control-fumigation.html, /c/agrovet.html), Sarit Centre Westlands pickup & 47-county delivery details, M-Pesa checkout, WhatsApp +254 789 514 060, and 4 buyer FAQs.
- SEO fields: Meta title (<60 chars with "Price in Kenya"), Meta description (<155 chars with KSh price), 5-8 Kenyan search keywords, accurate pack-size unit.

7. CATEGORY & SUBCATEGORY MAPPING
- Agrovet & Farm Supplies: 43dbe459-0749-4a9e-8f59-12bbb0026be2
- Pest Control & Fumigation: 8782c41a-6cd5-4e08-b7a9-ea51c940d972
- General Merchandise: 6371a3e2-2d70-4967-a6f1-6c6c5f9d623f
- Cars for Sale: c1739dd5-19a5-45c0-80ea-3676258b746a
- Assign the matching subcategory ID where available.

8. REGULATORY COMPLIANCE (NON-BLOCKING)
- Exclude any product on Kenya's PCPB banned/withdrawn list.
- For registered agrochemicals and veterinary medicines sold by licensed Kenyan distributors, save active ingredient and manufacturer details in attributes without stalling the batch. Never invent application rates.

9. DIRECT LIVE PUBLICATION IN NEON
- Insert all verified products in one transaction with stock = 1000. Because the Neon INSERT trigger forces active = false, after the insert transaction commits, ALWAYS run a separate UPDATE public.products SET active = true, low_at = 50 WHERE id IN (the IDs inserted in that transaction). Do not treat INSERT success as publication.
- Let Neon triggers populate selling price, slug, and permanent product code.
- Publish Live Immediately: Set active = true for every product with a verified ImageKit URL, baseline cost, SEO fields, and description.

10. POST-PUBLISH AUDIT & SUMMARY REPORT
- Verify every live product has active = true, images >= 1 (valid HTTP 200 ImageKit link), stock = 1000, low_at = 50, and selling price matching price_4tier(cost).
- Write one admin_audit_log entry per published product.
- Output the final report table (Product | Product code | Baseline cost | Selling price | Live ImageKit URL | Status) plus summary counts.


MANDATORY PHOTO QUEUE + ACTIVATION SAFETY (2026-11-23):
- Queue file: data/photo-queue.txt in GitHub repository stermontmall/stermontmall.github.io, branch main. Format: file-name|https://source-image-or-product-page per line, max 40 lines. A push to this file starts the ImageKit workflow.
- Wait for the workflow and read data/photo-results.json. Use only entries with ok=true and their verified browser_url; do not invent ImageKit URLs or infer success from a queue commit.
- After the product INSERT transaction has completed successfully, execute a separate UPDATE public.products SET active = true, low_at = 50 WHERE id IN (...) for exactly the inserted product IDs. Then re-select and verify active=true, stock=1000, low_at=50, non-empty images, and ImageKit URL. If photo upload or source price verification fails, do not publish that product.