# HANDOFF-services - Services Hub pages (branch `wip-services-pages`, NOT merged)
Last saved 2026-10-31 08:35 (Africa/Nairobi). Owner brief: uploaded PDF "Services Category Master Copy & SEO Blueprint" (8 services, price ranges, full copy only for Service 1 Pest Control). "Add those services categories professionally, expound on the document, rank on Google, secure opportunities. Autosave progress."
Read with `HANDOFF-live.md` (newest log) and `services/HANDOFF.md` (older: JS-rendered hub `/services/`, 15 services, short copy).

## Plan (small steps, push after each)
1. [x] Branch + this file (cd2d747).
2. [x] `services-data.json` (ab550bd): 8 services with expanded copy (lead, what is included, process, price factors, areas, 4-5 FAQs, shop links, guide links, related services). Facts only from the PDF; prices shown as "typical range, final quote before work starts".
3. [x] `services-build.mjs` (74faef5): renders `services/<slug>.html` (static, crawlable): title, description, canonical, Open Graph, JSON-LD (Service + LocalBusiness provider, BreadcrumbList, FAQPage), WhatsApp booking + call buttons, related services, shop and guide links only if the target file exists. `node services-build.mjs --check` also checks titles, descriptions, 350+ words, FAQs, JSON-LD, broken links and banned words.
4. [ ] BLOCKED: the temporary CI workflow `.github/workflows/render-services.yml` (same pattern as `render-batch-06.yml`) could NOT be pushed: the GitHub connector has no permission to write workflow files ("requires additional permissions"). The pages are therefore NOT generated yet. EXACT NEXT COMMAND in a clone: `git checkout wip-services-pages && node services-build.mjs --check && git add services && git commit -m "services: render pages" && git push`. Or reconnect the GitHub connector with workflow permission and ask Claude to add the CI workflow.
5. [ ] Link the 8 pages from `services/index.html` (static list near the top) and add them to the sitemap (find the sitemap generator first; do not edit `sitemap.xml` by hand).
6. [ ] Review the check output, fix, merge to `main` only when finished and tested.

## Decisions
- URLs follow the PDF: `/services/pest-control-fumigation-nairobi.html` etc. (canonical with `.html`, like `/blog/`).
- Claims in the PDF NOT stated as fact (the check fails the build if they appear): "certified", "best", "100%", "guaranteed", "non-toxic". The PDF's own offer (pre-inspection + 90-day guarantee) appears ONLY on the pest control page, worded as a follow-up promise, pending owner confirmation.
- "Genuine spare parts" (appliance repair) and "low-odour products" (pest control) are the owner's wording softened; confirm.
- Address, phone, hours are the ones already used on product pages (Sarit Centre, Karuna Road, Westlands; +254 748 888 230; 8 AM to 8 PM). No rating or review markup (none exists).
- Shop links appear only for categories that exist in `c/` (solar, CCTV, cleaning and electrical have none yet: no links shown).

## Owner to confirm
- 90-day guarantee terms for pest control (what is covered, what the customer must do).
- Whether staff and trades are licensed or certified where required before "certified" is used anywhere.
- Prices (from the PDF table) and which counties each service really covers outside Nairobi.
- Whether to add shop categories for solar, CCTV, cleaning and electrical so those pages can link to products.
