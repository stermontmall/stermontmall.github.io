# Instructions for any Claude session on this repo

## Product posting — mandatory
If the owner asks to add/post/list an advert or product, or attach product photos:
1. Read `PUBLISHING.md` FIRST and follow it.
2. Use the project slash command `/post-product` as the task checklist (defined in `.claude/commands/post-product.md`).
3. PHOTOS ARE MANDATORY FOR PUBLICATION. Prefer sending the exact public HTTPS supplier/product-page URL to the deployed Supabase `upload-photos` function as `{product_id, image_url}`; deployed v14 automatically extracts up to four candidates (Open Graph, Twitter image, `image_src`, image metadata and Product JSON-LD). If extraction fails, use a direct HTTPS image URL; if blocked, send exact image bytes as `image_base64` or multipart `files`. It stores the file in `product-images` and updates `products.images`. The function validates image bytes, not product identity. Always open and visually inspect the final public Storage URL and confirm exact product/model/pack before activation. NEVER publish a product with no exact, visually verified image. If final visual QA fails or the stored image cannot be opened, leave it inactive and report the blocker; never substitute a generic or mismatched image.
4. Never invent a photo URL. Only report a photo as attached after checking the Storage object and the `products.images` reference.
5. Owner's new-product rules (updated 2026-11-08): source KES cost + default 15% markup; stock=1000; low-stock alert=20; research the SEO title (max 60 chars) and description yourself; PUBLISH LIVE (`active=true`) as soon as the row and photo are verified, with no owner-approval wait. FIND THE SOURCE PRICE ONLINE YOURSELF: lowest current in-stock KES listing of the exact product (same brand, model, pack size) on a reputable Kenyan seller page, URL recorded. Never invent a price: if no KES listing of the exact product exists, stop and ask. Use 15% by default for every new product; an explicit batch override must be within the helper's accepted 15–300% range.
6. PRODUCT LINK (owner rule 2026-11-08, permanent): the link you give the owner for any product MUST be the mobile shell: `https://stermontarcade.co.ke/?product=<products.slug>`. NEVER give `/p/<id>.html` or `/classic.html` as the link (they open the old/static page). Do not add a visitor redirect on `/p/` pages to achieve this: it was removed on 2026-11-03 over a suspected ranking drop (`HANDOFF-stop-shell-redirect.md`).

## Handoff and progress saving
1. FIRST read `HANDOFF-live.md` (newest progress, wins over everything), THEN `HANDOFF.md` (long history).
2. AUTO-SAVE RULE (owner): after every step (commit, merge, finding, blocker) update `HANDOFF-live.md` straight away: Done / In progress / Next / Blocked, with links and exact commands. The owner may hit a usage limit at any moment and continue on another Claude account; an unsaved step is lost.
   - Save when a task starts, when each task finishes, BEFORE any long command (clone, test run, build) with the exact command to re-run, and whenever blocked.
   - Commit and push `HANDOFF-live.md` with each step (on the `wip-` branch, or on `main` for note-only commits). Add one line to `HANDOFF.md` only when a branch is finished or merged.
   - Each entry: date and time (Africa/Nairobi), what changed, branch and commit, exact next command.
3. Working rules: small steps on a `wip-<task>` branch, push after each, merge to `main` only when finished AND tested. Never edit generated pages (`p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`); edit the generators. Bump `?v=` in `index.html` for every change to `mobile-shell/app.js` or `tailwind.css`. Back up old product text in `description_backup` before writing to Supabase. Do not touch product titles unless explicitly asked.
4. If the sandbox has no network or clone, say which tests could not be run and put the exact command in `HANDOFF-live.md`.
5. To rebuild product pages NEVER edit or rewrite `.github/workflows/product-pages.yml` (on 2026-11-08 a commit replaced it with comments only and no page was rebuilt for two hours). Trigger it with `gh api -X POST repos/stermontmall/stermontmall.github.io/actions/workflows/product-pages.yml/dispatches -f ref=main`. `workflow-guard.yml` fails the push if any workflow file is empty or invalid.
6. Never link to `/classic.html`; the checkout is `/checkout.html` (opened only inside the shell). `no-classic-hop.test.mjs` enforces this.


## Current owner master product prompt (2026-11-14)
- Use exact source KES cost and `round(cost * 1.15, 2)` selling price; do not apply a second markup or charm-price uplift. Stock=1000, low_at=20, featured=false.
- Product descriptions must be 600–900 original, factual words for this workflow. The database helper accepts 40–2,000 words; skip thin-fact products rather than pad.
- `public.products` has `seo_title` but no dedicated `meta_description` column. The page generator builds the meta description from the first factual sentence of the product description (max 155 characters); make that sentence concise and product-specific. Do not invent a column or make schema changes for this batch.
