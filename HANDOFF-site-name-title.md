# HANDOFF - Site name: title and alternateName (branch `wip-site-name-2`, 2026-10-31)
Owner: show "Stermont Arcade" instead of the raw domain in Google results. Requested: WebSite JSON-LD with alternateName, `<title>Stermont Arcade | Online Store Kenya</title>`, `og:site_name`.
See also `HANDOFF-site-name.md` (the earlier session, PR #78). Paste both at the top of HANDOFF.md when it is next rewritten with a git push (the connector cannot rewrite the 72 KB file safely).
## Found (main before this branch)
- Already there from PR #78: `og:site_name` = Stermont Arcade, a WebSite JSON-LD block (inside an `@graph` with FAQPage, linked to the OnlineStore `#org`), hidden brand `<h1>`, `lang="en-KE"`, crawlers skip the desktop redirect.
- So no second WebSite block was added (two WebSite blocks on one page can conflict); the existing one was extended.
## Done (`index.html` and `mobile-shell/shell.test.py` only)
- [x] `<title>` is now `Stermont Arcade | Online Store Kenya` (was `... | Online Shopping Store in Kenya`).
- [x] WebSite `alternateName` = ["Stermont Arcade Kenya", "stermontarcade.co.ke", "Stermont", "StermontArcade"]. The bare domain is included because the owner asked for it; the earlier session had left it out on purpose, so if Google keeps showing the domain, remove "stermontarcade.co.ke" from that list first.
- [x] `shell.test.py` home-page title check updated to the new title.
- [x] TESTS: `python3 mobile-shell/shell.test.py` 106/106 on the pushed branch (run in a clone with Chromium, fixture data); `node seo-titles.test.mjs` 35 OK; `node buy-name.test.mjs` 49 OK. The pushed `index.html` is byte-identical to the tested file.
- [x] MERGED TO `main` on 2026-10-31. Revert the merge commit to undo.
## Not changed (say if you want them too)
- `og:title` and `twitter:title` still read "Stermont Arcade | Online Shopping Store in Kenya" (only `<title>` was requested).
- `/classic.html` and the other pages keep their own titles.
## Left
- [ ] Search Console: URL Inspection for https://stermontarcade.co.ke/ -> Test live URL -> Request indexing. Check the Rich Results Test for the WebSite block.
- [ ] Google can take days to weeks to change the displayed site name. If it still shows the domain after a few weeks: make sure favicon.png is a square multiple of 48 px, and that the name is the same on the Google Business Profile and social pages.
- [ ] The shorter title drops the words "Shopping Store"; watch Search Console for the home page's click-through and ranking on "online shopping Kenya".
