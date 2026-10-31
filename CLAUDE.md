# Instructions for any Claude session on this repo

1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
3. Working rules (from HANDOFF.md): small steps on a `wip-<task>` branch, push after each step, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
