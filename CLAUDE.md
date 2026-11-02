# Instructions for any Claude session on this repo

## Product posting — mandatory
If the owner asks to add/post/list an advert or product, or attach product photos:
1. Read `PUBLISHING.md` FIRST and follow it literally.
2. Use the project slash command `/post-product` as the task checklist (defined in `.claude/commands/post-product.md`).
3. The required route is the authenticated admin AI photo uploader at `/admin.html` → AI product photo uploader. It transfers the actual image bytes to Supabase `ai-add-product`, stores the file in `product-images`, and creates a draft row with the image URL.
4. Never manually insert a product before actual image transfer. Never report an upload unless the Storage object, public URL and `products.images` reference are verified.
5. Owner's new-product rules: source KES cost + 15% markup; stock=1000; low-stock alert=20; draft (`active=false`) pending owner approval. No old 85% / 16% formulas unless owner explicitly changes the rule for that batch.
6. If this Claude environment cannot access the actual attachment bytes and authenticated upload session, state the exact blocker and guide the owner to the admin AI uploader. Do not fabricate or silently skip photos.

## Handoff and progress saving
1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
   - Save when a task starts, when each task finishes, BEFORE any long command (clone, test run, build) with the exact command to re-run, and whenever blocked.
   - Commit and push `HANDOFF-live.md` with each step (on the `wip-` branch, or on `main` for note-only commits). Add one line to `HANDOFF.md` only when a branch is finished or merged.
   - Each entry: date and time (Africa/Nairobi), what changed, branch and commit, exact next command.
3. Working rules: small steps on a `wip-<task>` branch, push after each, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles unless explicitly asked.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
