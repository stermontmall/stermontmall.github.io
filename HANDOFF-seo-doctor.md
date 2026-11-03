# HANDOFF: SEO Doctor fix

## Session 2026-11-03 (briefs -> final content pipeline)

### Root cause (confirmed)
- Supabase edge function `seo-research` (v19, engine `weighted-onpage-audit-v2`) is a deterministic checklist. It has no AI. It writes an "Editorial improvement brief" into `seo_content_proposals.draft_markdown` ("not publish-ready replacement copy").
- Edge function `seo-review` only flips status pending -> approved/rejected. It never checks content and never changes the live page.
- Before this session: 178 pending proposals, 11 approved briefs, 0 published.

### Done (Supabase project oewvtbnmyombbtggamor, applied live)
- Migration `seo_proposals_block_briefs_from_publishing`:
  - New columns on `seo_content_proposals`: `content_kind` ('brief' default | 'final'), `final_title`, `final_description`, `final_body_html`, `locked_facts` (jsonb).
  - Trigger `seo_proposal_guard_trg`: a row cannot be `approved` or have `published_at` unless `content_kind='final'` and title, description and body are non-empty and contain no instruction text (write a unique, review these, editorial brief, todo, tbd, lorem ipsum, [insert, consider adding, should be rewritten). Tested: blocks approval of a brief.
  - The 11 approved briefs were set to `superseded-<id>` (not deleted).
- Pilot page services/deep-cleaning-carpet-wash-nairobi.html: PR #283 MERGED to main (2026-11-03). New title (48 chars) and description (159 chars) in title/meta/og/twitter/JSON-LD; thin "Who we serve" and "Where we work" sections rewritten (old text said "Nairobi and nearby towns", contradicting the all-47-counties copy). Prices (KSh 4,000 / KSh 20,000), phone, address, FAQ, offers JSON-LD unchanged.
- Pilot proposal `ee930ced-f2ba-4175-993e-8ed90637b03e`: `content_kind='final'`, status `approved`, `published_at` still NULL (set it only after the live check below passes).
- Sitemap check: the page is in `services/sitemap-services.xml` (listed in robots.txt), NOT in the main `sitemap.xml`. Its lastmod was 2026-10-31 (stale). Branch `seo-sitemap-lastmod-cleaning` bumps it to 2026-11-03; needs merging.

### Left (in order)
1. Merge branch `seo-sitemap-lastmod-cleaning` (sitemap lastmod + this handoff).
2. Live check (not possible from the Claude session, no network to the live site): view-source of https://stermontarcade.co.ke/services/deep-cleaning-carpet-wash-nairobi.html shows `<title>Deep Cleaning &amp; Carpet Wash Nairobi | KSh 4,000+</title>` and the new description; https://stermontarcade.co.ke/services/sitemap-services.xml shows lastmod 2026-11-03 for the page. Then Search Console > URL Inspection > Request indexing, and resubmit `services/sitemap-services.xml` under Sitemaps. Then set `published_at=now()` on the proposal row.
3. Check whether `seo-google-sitemaps.mjs` / `sitemap-state.json` regenerates `services/sitemap-services.xml` and would overwrite the manual lastmod; if so, make lastmod come from the proposal's `published_at`.
4. Change `seo-research` so it produces `content_kind='final'` rows. It needs an LLM API key in edge function secrets (not visible from the MCP). Required behaviour: read the page, extract locked facts (all KSh amounts, phone, address, service names) into `locked_facts`, generate title (<=60 chars), description (110-160 chars) and replacement section HTML, then reject output if any locked fact is missing or changed. Until then final content is written by hand per page.
5. `seo-review`: on approve, require `content_kind='final'` (the DB trigger already enforces it, so the function should surface the trigger error message to the admin UI).
6. Build the apply step: script that takes an approved final proposal and edits the page file via a GitHub pull request (never commit to main), with a before/after diff in the PR body. `seo-doctor.js` / admin.html "Approve" should show the diff, not just flip status.
7. Remaining 177 pending proposals are all briefs (`content_kind='brief'`). Work them page by page, highest traffic first (Search Console Performance > Pages). The 11 earlier approved briefs were superseded, so those pages need new finals too.
8. From the older handoff: bump `seo-doctor.js?v=18` to `v=19` in admin.html when `wip-seo-doctor` is merged (that branch was not touched this session).

### Rules for writing final content
- Never change or add a price, phone number, address, guarantee, credential, review or location that is not already on the page.
- Replace thin or contradictory sections with finished copy; do not add keyword-stuffed blocks.
- Commit through a branch and PR only.

## Earlier work (branch wip-seo-doctor, not merged)
- DB: `seo_content_proposals.target_type` check now also allows `page`.
- `seo-doctor.js`: scans every page scoring under 100 (weakest first, max 200) in batches of 8; page type decided by URL prefix (`/p/`, `/c/`, `/blog/`, `/services/`); fixed `\\s+` regex; status shows 100/100, hidden and needs-improvement counts.
- Edge function `seo-research` accepts 8 targets per call and `page`.
