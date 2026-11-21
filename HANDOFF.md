# HANDOFF: Google Site Name and favicon (wip-site-name-favicon)

Date: 2026-11-21

## Done
- index.html head: removed the lime "S" icon links (/favicon.png, /favicon.ico, /apple-touch-icon.png).
- Declared one favicon: `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">` (purple Stermont Arcade icon, 192x192).
- Declared one apple-touch-icon: `/icon-192.png`. Removed the duplicate second apple-touch-icon that conflicted with the first.
- WebSite JSON-LD (already present in the @graph block): added "stermontarcade.co.ke" to alternateName.
- Already correct, unchanged: og:site_name "Stermont Arcade", title "Stermont Arcade | Pest Control & Online Shopping Kenya", canonical https://stermontarcade.co.ke/, H1 starts "Stermont Arcade", robots.txt (Allow: / for all agents, no rule blocks favicon or icon files).

## Left
- /favicon.png, /apple-touch-icon.png and /favicon.ico are still the lime "S" artwork. Replace them with the purple icon (copy icon-192.png / icon-512.png over them locally, build a multi-size .ico) so any crawler or browser that requests those default paths also sees the purple logo.
- Check other templates (product pages, /c/ pages, services, blog) for the old favicon links; generator scripts (generate-products.mjs, seo-shell-chrome.mjs) were not inspected for icon links.
- After merge and green GitHub Actions: view-source the live homepage, test in Google Rich Results Test, then request indexing of https://stermontarcade.co.ke/ in Search Console. Site name and icon updates in Google can take days to weeks.

## Decisions
- Kept trailing slash on the WebSite url and canonical (matches the existing canonical and hreflang).
- Kept the WebSite block inside the existing @graph rather than adding a second standalone block.
- Pointed icon links at the existing purple icon-192.png because binary files could not be overwritten from the editing tool used.
