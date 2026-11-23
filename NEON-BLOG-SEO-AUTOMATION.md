# Neon + GitHub blog, SEO and Google indexing automation

This integration keeps GitHub Pages as the publishing/build system and uses Neon project `restless-shape-79120240`, database `stermont`, as the durable content and SEO reporting store. It does not call Supabase.

## What runs automatically

| Workflow | Schedule / trigger | Result |
|---|---|---|
| Blog writer | Daily at 09:00 Nairobi time | Creates one article draft and opens a PR; a human must review and merge it. |
| Build blog index and sitemap | On blog post changes | Rebuilds `blog/index.html` and the blog sitemap entries. |
| Neon blog + SEO automation | Daily and on blog/SEO source changes | Syncs topic queue and published blog metadata to Neon; runs the technical SEO audit and stores its report. |
| Google sitemap ping | Daily, after product-page build and on demand | Submits the five sitemap URLs to Search Console and stores HTTP results in Neon. |
| Google indexing status | Daily and on demand | Inspects a rotating batch of URLs with Search Console and stores the report plus non-indexed URL details in Neon. |
| SEO opportunities | Weekly | Opens a GitHub issue with Search Console ranking opportunities. |

Google decides which pages it indexes. Sitemap submission and URL inspection are notifications/diagnostics, not a guarantee or force-indexing mechanism.

## Neon schema

Migration: `db/migrations/20261122_blog_seo_google_automation.sql`

Tables:
- `public.content_topics`: blog topic queue mirrored from `blog-topics.json`.
- `public.blog_posts`: published blog URL, title, metadata and content-file SHA.
- `public.seo_audits`: dated technical SEO and Search Console reports.
- `public.google_index_inspections`: URL Inspection status for URLs Google reports as not indexed.
- `public.google_sitemap_submissions`: HTTP result for each submitted sitemap.

The tables are private to the Neon database owner; public/anonymous/authenticated roles are explicitly denied access. GitHub Actions connects through a database connection string stored as a secret.

## One-time GitHub configuration required

In repository **Settings → Secrets and variables → Actions → New repository secret**, add:

- `NEON_DATABASE_URL`: direct Neon connection string for database `stermont`, using a restricted automation role if one is provisioned. Do not paste this value into source code, issues or chat.
- `GSC_SERVICE_ACCOUNT_JSON`: existing Google service-account JSON key with Search Console access.
- `GSC_PROPERTY`: exact Search Console property, e.g. `sc-domain:stermontarcade.co.ke`.

The Google service account must be added in Search Console → Settings → Users and permissions. The blog writer separately needs `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`. GitHub Actions must be allowed to create pull requests.

## Important boundaries

- Product/category page generation is still a separate pipeline. Its current `generate-products.mjs` workflow has legacy Supabase dependencies; this Neon blog/SEO automation deliberately does not invoke that workflow or claim that the full catalogue has migrated.
- Existing blog article publishing remains human-reviewed. A generated draft is not published until its pull request is merged.
- Keep product canonical URLs, existing indexed /p/ HTML, and owner-approved shell product links unchanged.
- The first successful Neon sync seeds the topic and blog tables from the repository. Subsequent runs upsert metadata; they do not delete historical audit or submission records.
