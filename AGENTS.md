# Instructions for any AI agent on this repo

> **PRODUCT PUBLISHING SOURCE OF TRUTH (Version 8):** Use Neon `stermont.public.publishing_rules` key `publish_products`; the exact repository mirror is `PUBLISHING_RULES.md`. Do not follow superseded product/photo instructions or Supabase publishing paths. Read the live Neon rule first for every publishing task.

Read `CLAUDE.md` first: it holds the full repository rules (product posting, handoff, working rules). The rule below is the same canonical text as in `CLAUDE.md`; it replaces all older conflicting product-posting rules.

## Product publishing — single canonical rule

For every request to discover, add, post, or publish products or product photos, read the root `PUBLISHING_RULES.md` and fetch the live Neon Version 8 source:
`SELECT content FROM public.publishing_rules WHERE key = 'publish_products';`
Neon project: `restless-shape-79120240`, database: `stermont`. If Neon cannot be read, use the exact root-file mirror. Follow Version 8 end-to-end (section 12 is the default workflow); do not use superseded product/photo rules or Supabase publishing paths. The Version 8 file is the only repository publishing rule.

## Permanent human-facing product-link rule (owner 2026-11-08)
Every customer- or staff-facing product link (WhatsApp text, share/copy controls, storefront cards, recommendations, admin/order/receipt/email links, blog/guide CTAs) MUST use the shared `shellProductLink(slug)` helper and resolve to `https://stermontarcade.co.ke/?product=<products.slug>`. Never use `/p/<slug>.html` or `/classic.html` for a human-facing product link. The `/p/<slug>.html` documents stay live and indexable for Google; do not change their canonical, `og:url`, sitemap entries, Product/ItemList JSON-LD, breadcrumbs or `seo-links` crawl links. Never add visitor redirects, JavaScript redirects or user-agent switching to `/p/` pages. Run `node no-static-share-links.test.mjs`; the SEO PR workflow enforces it.
