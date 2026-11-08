# Stermont Arcade — SEO Architecture and Control Plan

Last reviewed: 2026-11-09 (Africa/Nairobi)
Site: https://stermontarcade.co.ke
Repository: stermontmall/stermontmall.github.io

## 1. Search intent and site hierarchy

Keep the public site organized around four distinct search-intent groups:

1. **Shop / transactional** — products, product variants, prices, stock and category pages.
2. **Services / local commercial** — fumigation and pest-control services, with truthful service-area coverage and clear enquiry actions.
3. **Guides / informational** — practical Kenya-specific buying, application-safety and problem-solving guides that link to relevant categories, products and services.
4. **Brand / trust** — About, contact, shipping, returns, privacy, payment and business information.

Do not mix informational blog URLs into product/category URL namespaces. Do not create multiple pages targeting the same primary query unless their intent is genuinely different.

## 2. Product SEO standard

For every active product:
- One canonical product URL; preserve existing slugs unless a redirect plan is tested and approved.
- Distinct, factual product name and page H1; include brand/model/pack size only when verified.
- Unique title (target <= 60 characters) with product identity and Kenya intent where it reads naturally.
- Meta description (target roughly 140–155 characters), describing the actual item, pack/model, availability and a truthful purchase benefit.
- Visible price and stock must agree with Product structured data.
- Product JSON-LD must reflect visible name, image, price, currency, availability and actual brand/GTIN/MPN only when verified.
- Exact matching product image; no emoji, generic substitute or unrelated pack/model.
- Useful original description; avoid repeated filler and unsupported claims.
- Related links to the correct parent category, sibling pack sizes and genuinely useful guides.
- Product pages must appear in the product sitemap after a successful build.

## 3. Category and internal-link architecture

Use a clear parent > child > product hierarchy. Category pages should:
- Have a unique category title, H1 and description.
- Explain the category and help a Kenyan buyer choose between relevant products.
- Link to child categories and products using descriptive anchor text.
- Link to a small number of relevant buying/use guides.
- Avoid near-duplicate copy across adjacent categories.

Every product breadcrumb and BreadcrumbList JSON-LD must use the same actual category hierarchy. Related-category links must never determine the product's breadcrumb.

## 4. Services SEO architecture

Keep service pages separate from shop product listings. Organize service content around distinct customer problems:
- Residential fumigation and household pest control
- Commercial, hotel and restaurant pest management
- Bed bug treatment
- Termite inspection and control
- Cockroach, ant and rodent control
- Warehouse, grain-store and container fumigation

Each service page should state the actual service, target property/customer, process, preparation and safety expectations, follow-up/limitations, service locations genuinely covered, and a clear enquiry route. Use real project photos only with permission. Do not claim to be the best in a city, claim certifications, or imply PCPB authorization unless documented.

## 5. Blog and guide clusters

Build topic clusters, not disconnected posts:
- Bed bugs: identification, rentals/hostels, treatment preparation, prevention, product selection.
- Termites: inspection signs, pre-construction treatment, existing structures, monitoring and professional treatment.
- Cockroaches/ants: sanitation, entry points, bait vs spray, safe product selection.
- Rodents: proofing, traps, bait stations, food-store protection.
- Mosquitoes/flies: breeding-site reduction, screens, traps and safe control.
- Agrovet/crop protection: crop-specific problems, label reading, resistance management and registered-product checks.
- E-commerce buying guides: phones, appliances, equipment and online shopping in Kenya.

Each guide must answer one main question, cite reliable evidence where needed, carry a reviewed/updated date, and link to the most relevant service/category/product pages. Avoid publishing near-duplicate articles that compete for the same query.

## 6. Technical SEO release gates

The product-page workflow currently includes tests for canonical URLs, robots directives, sitemap availability, product identifiers, metadata, content and page existence. Keep these tests in the production workflow.

Before considering an SEO release complete, verify:
- GitHub Actions product-page build succeeded.
- Every active product has a generated page.
- Canonical URL is self-referencing and returns HTTP 200.
- Product title, description, H1, image and JSON-LD agree.
- Product/category/blog/service sitemap entries are valid and return HTTP 200.
- No accidental noindex, blocked assets, redirect loops or soft 404s.
- Mobile-shell product links still open the correct product.
- IndexNow submission is not described as Google indexing.
- Google Search Console indexing/performance must be checked separately; a sitemap submission does not guarantee indexing or rankings.

## 7. Current audit snapshot (database; checked 2026-11-09)

- Active products: 729.
- Active products with blank seo_title: 0.
- Active products with blank seo_name: 0 (the 40 missing values were normalized using verified catalogue names and shared variant-group names).
- Active products with seo_title longer than 60 characters: 0 (28 overlength titles were corrected).
- Active products with no category_id: 0.
- Active products with an empty images array: 0.
- Seven active agrochemical listings still reference legacy github.io photo paths previously identified as missing from both repository and Storage. A non-empty image array is not proof that an image loads or matches the product; those seven remain blocked for photo replacement and visual verification.
- Product description audit (whitespace word count): 0 active products below 600 words; 272 are in the 600–800 band; 457 exceed 800 words. The overlength group contains a repeated generic “PRODUCT BUYING GUIDE” block appended to older original copy. This is not acceptable as final product SEO: those 457 descriptions need product-specific compression/rewrite to 600–800 words, not blind truncation.
- Category taxonomy: 54 generated category landing pages plus `/c/index.html`. Eight parent hubs are now generated and linked: Clothing & Fashion, Phones & Accessories, TV/Audio/Video, Computers & Accessories, Home & Kitchen, Kids & Baby, Shoes, and Health & Beauty.
- Image sitemap: 668 entries; zero double-escaped query strings. The seven confirmed missing legacy photo URLs are excluded from the image sitemap, but their product pages still need real replacement photos uploaded and verified.

## 8. Ordered implementation queue

1. **P0 — Product description quality:** rewrite the 457 over-800-word descriptions into unique, product-specific 600–800-word content and remove the repeated generic buying-guide boilerplate.
2. **P1 — Image integrity:** replace and visually verify the seven known dead legacy product-photo references; then sample the remaining catalogue for exact product/pack match.
3. **P1 — Category taxonomy:** check empty leaf categories, breadcrumbs and internal links after the eight parent hubs were generated.
4. **P1 — Product-page structured data:** compare rendered H1, price, availability, image and JSON-LD for representative products and multi-size groups.
5. **P2 — Live validation:** test product/category/service/blog URLs, canonical tags, meta descriptions and all sitemap endpoints from a public network; the browser checker could not reach the custom domain in this session.
5. **P2 — Services:** ensure each core service has one complete, indexable, distinct landing page and accurate local coverage.
6. **P2 — Blog clusters:** map each existing article to one intent and cluster; merge or redirect only after URL and traffic review.
7. **P3 — Measurement:** use Google Search Console query/page data to prioritize pages by impressions, clicks, CTR and position; track enquiries and product sales separately.

## 9. Safety rules

- Do not change established product slugs or remove indexed pages without a tested 301 redirect and sitemap update.
- Do not claim guaranteed first-page rankings or a perfect SEO score.
- Do not invent product specifications, regulatory approvals, service locations, reviews or business credentials.
- Do not change prices, stock, images or product activation as part of an SEO-only cleanup.
- Save a handoff after each meaningful implementation step.
