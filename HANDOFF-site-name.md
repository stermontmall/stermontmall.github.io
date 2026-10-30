# HANDOFF - Site name in search results (branch `wip-site-name`, 2026-10-31)
Owner: Google shows the bare domain (stermontarcade.co.ke) instead of the brand name "Stermont Arcade" above the URL.
Note: this section is a separate file only because HANDOFF.md is too large to rewrite safely through the GitHub tool. On merge, paste it at the top of HANDOFF.md.
## Found (main, before this branch)
- Already correct: title, meta description, og:site_name, OG/Twitter tags, canonical, favicon links, a WebSite JSON-LD block (name + alternateName).
- Gaps: no brand text anywhere on the page (header has only icons; the only h1 was "Recommended for you"); the desktop redirect to /classic.html (noindex) also ran for crawlers whose renderer is wide; WebSite and OnlineStore blocks were not linked; html lang was "en".
## Done (index.html only, one commit)
- [x] Visually hidden `<h1>Stermont Arcade</h1>` at the top of body; the grid heading `#grid-title` is now an `<h2>` (app.js only sets its text).
- [x] JSON-LD: OnlineStore got `@id` .../#org; WebSite `alternateName` = ["Stermont","StermontArcade"] and `publisher` -> #org. FAQPage kept in the same graph. The bare domain is NOT used as a name on purpose (Google's fallback would then show the domain).
- [x] `<html lang="en-KE">`.
- [x] The desktop redirect script returns early for crawlers/preview bots (bot, crawl, spider, googlebot, bingbot, inspectiontool, lighthouse, pagespeed, facebookexternalhit, whatsapp).
- [x] The seo-links block was copied exactly from main as it was at commit time (the build bot rewrites it between its markers on every run).
## Left
- [ ] NOT TESTED: the sandbox cannot run `python3 mobile-shell/shell.test.py` here. Run it before merging. If a check looks for `h1#grid-title` or counts h1 elements, change it to match (h1 is now the hidden brand name).
- [ ] Merge to `main` only after the test run, then in Search Console: URL Inspection for https://stermontarcade.co.ke/ -> Test live URL -> Request indexing. Check the Rich Results Test for WebSite errors.
- [ ] Google can take days to weeks to change the displayed site name. If it still shows the domain after a few weeks, check that favicon.png is a square multiple of 48 px and that the name is the same on the Google Business Profile and social pages.
- [ ] If `index.html` changed on main since this commit, merge carefully: the only hand edits are the html lang, the two JSON-LD blocks, the redirect script, the hidden h1 and the h1->h2 in the home view.
