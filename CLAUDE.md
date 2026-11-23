# Instructions for any Claude session on this repo

> **PRECEDENCE (2026-11-22, owner-approved):** New products are posted to **Neon**, not Supabase. The governing rule is Neon `public.publishing_rules` key `publish_products` (currently version 6; mirror: `PUBLISH-PRODUCTS-RULE.md`). The admin tab `/admin.html#pricing-rules` now reads that Neon row. Where this file's Supabase-era text (800+ word descriptions, Supabase Storage photo upload, Supabase duplicate check) conflicts with `publish_products`, `publish_products` wins.

## Product posting — mandatory

For every request to discover, add, post, or publish products or product photos, read the root `PUBLISHING_RULES.md` and fetch the live Neon Version 6 source:
`SELECT content FROM public.publishing_rules WHERE key = 'publish_products';`
Neon project: `restless-shape-79120240`, database: `stermont`. If Neon cannot be read, use the exact root-file mirror. Follow Version 6 end-to-end; do not use superseded product/photo rules or Supabase publishing paths. Human-facing product links must use `https://stermontarcade.co.ke/?product=<slug>`; keep static `/p/<slug>.html` pages live and indexable for Google.

## Handoff and progress saving
1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
   - Save when a task starts, when each task finishes, BEFORE any long command (clone, test run, build) with the exact command to re-run, and whenever blocked.
   - Commit and push `HANDOFF-live.md` with each step (on the `wip-` branch, or on `main` for note-only commits). Add one line to `HANDOFF.md` only when a branch is finished or merged.
   - Each entry: date and time (Africa/Nairobi), what changed, branch and commit, exact next command.
3. Working rules: small steps on a `wip-<task>` branch, push after each, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles unless explicitly asked.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
5. To rebuild product pages NEVER edit or rewrite `.github/workflows/product-pages.yml` (on 2026-11-08 a commit replaced it with comments only and no page was rebuilt for two hours). Trigger it with `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`. `workflow-guard.yml` fails the push if any workflow file is empty or invalid. Owner-approved exception (2026-11-16): the commit step and the conflict-resolution `case` list in that workflow include `robots.txt`, so the generated `robots.txt` is committed with the other generated files. Keep that addition when touching the workflow; do not remove it.
6. Never link to `/classic.html`; the checkout is `/checkout.html` (opened only inside the shell). `no-classic-hop.test.mjs` enforces this.


## Product data notes (pricing and word-count rules moved to the bulk publishing rule below)
- Pricing, stock defaults and description length are set by `