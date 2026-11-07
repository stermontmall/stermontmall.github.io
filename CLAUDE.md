# Instructions for any Claude session on this repo

## Product posting — mandatory
If the owner asks to add/post/list an advert or product, or attach product photos:
1. Read `PUBLISHING.md` FIRST and follow it.
2. Use the project slash command `/post-product` as the task checklist (defined in `.claude/commands/post-product.md`).
3. PHOTOS ARE OPTIONAL AND NEVER BLOCK POSTING (owner instruction; same as Supabase `site_playbook` topics `add_product` / `add_photo`). If no photo is supplied, RESEARCH one online yourself (exact product, manufacturer/supplier/official retailer page, at least 450x450, no other shop's watermark) and attach it by any working route: the `upload-photos` Edge Function (`product_id` + `image_url`, `image_base64`, `images` or `openaiFileIdRefs`), `public.add_product_photo`, or the admin AI photo uploader at `/admin.html`. If no suitable photo can be found, publish without one and say so.
4. Never invent a photo URL. Only report a photo as attached after checking the Storage object and the `products.images` reference.
5. Owner's new-product rules (updated 2026-11-08): source KES cost + 15% markup; stock=1000; low-stock alert=20; research the SEO title (max 60 chars) and description yourself; PUBLISH LIVE (`active=true`) as soon as the row and photo are verified, with no owner-approval wait. Never guess a price: if the verified source KES price is missing, stop and ask. No old 85% / 16% formulas unless owner explicitly changes the rule for that batch.

## Handoff and progress saving
1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
   - Save when a task starts, when each task finishes, BEFORE any long command (clone, test run, build) with the exact command to re-run, and whenever blocked.
   - Commit and push `HANDOFF-live.md` with each step (on the `wip-` branch, or on `main` for note-only commits). Add one line to `HANDOFF.md` only when a branch is finished or merged.
   - Each entry: date and time (Africa/Nairobi), what changed, branch and commit, exact next command.
3. Working rules: small steps on a `wip-<task>` branch, push after each, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles unless explicitly asked.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
