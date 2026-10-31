# HANDOFF-services - Services Hub pages (branch `wip-services-pages`, NOT merged)
Started 2026-10-31 08:20 (Africa/Nairobi). Owner brief: uploaded PDF "Services Category Master Copy & SEO Blueprint" (8 services, price ranges, full copy only for Service 1 Pest Control). "Add those services categories professionally, expound on the document, rank on Google, secure opportunities. Autosave progress."
Read with `HANDOFF-live.md` (newest log) and `services/HANDOFF.md` (older: JS-rendered hub `/services/`, 15 services, short copy).

## Plan (small steps, push after each)
1. [x] Branch + this file.
2. [ ] `services-data.json`: 8 services, expanded copy (intro, what is included, process, price factors, areas, 5 FAQs, shop links, related services). Facts only from the PDF; owner's prices as "typical range, final quote after inspection".
3. [ ] `services-build.mjs`: renders `services/<slug>.html` (static, crawlable) with title, description, canonical, Open Graph, JSON-LD (Service, BreadcrumbList, FAQPage), WhatsApp booking links; shop links only if `c/<slug>.html` exists.
4. [ ] Temporary CI workflow `.github/workflows/render-services.yml` (same pattern as `render-batch-06.yml`): runs the build + checks on this branch and commits the pages + a report, because this chat session has no node/clone.
5. [ ] Link the 8 pages from `services/index.html` (static list) and add them to the sitemap (find the sitemap generator first; do not edit `sitemap.xml` by hand).
6. [ ] Review the CI report, fix, delete the temporary workflow, merge to `main` only when finished and tested.

## Decisions
- Page URLs follow the PDF: `/services/pest-control-fumigation-nairobi.html` etc. (canonical with `.html`, like `/blog/`).
- Claims the PDF makes that I could not verify are NOT stated as fact: "certified", "best", "guaranteed eradication", "chemical-certified". The PDF's own offer (pre-inspection + 90-day guarantee for pest control) is kept as the owner's offer and listed below for confirmation.
- No address/rating/review markup beyond what the repo already states (Sarit Centre, Karuna Road, Westlands, 8 AM to 8 PM daily; +254 748 888 230).

## Owner to confirm
- 90-day guarantee terms for pest control (what is covered, what the customer must do).
- Whether pest-control staff and the other trades are licensed/certified where required before "certified" is used anywhere.
- Prices (taken from the PDF table) and which counties each service really covers outside Nairobi.
