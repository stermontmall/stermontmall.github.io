# PUBLISHING.md — how Claude posts products + photos (single source of truth)

If this file disagrees with an older HANDOFF file, THIS FILE WINS for product posting.
(`HANDOFF-products-posting-20261102.md` photo section is outdated: its 5 photos are already attached.)

## Exact locations
| Thing | Where |
|---|---|
| Live site | https://stermontarcade.co.ke (GitHub Pages, repo `stermontmall/stermontmall.github.io`, branch `main`) |
| Database | Supabase project `oewvtbnmyombbtggamor` (eu-west-1), table `public.products` (+ `public.categories`) |
| Photo storage A (newest items) | Supabase public bucket `product-images` → URL `https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/<file>` |
| Photo storage B (older items) | Repo folder `product-photos/<product-id>.jpg` → URL `https://stermontmall.github.io/product-photos/<product-id>.jpg` |
| Page builder | `.github/workflows/product-pages.yml` (runs every 3 h and can be run by hand from the Actions tab). It builds `p/`, `c/`, sitemaps from ACTIVE products. |

## Who can do what
- Claude in claude.ai chat (GitHub + Supabase connectors): CAN add/edit product rows with SQL, set `images` URLs, check results. CANNOT upload image files (no network, no binary upload tool).
- Claude Code / any session with network + `gh`/Supabase access: can do everything, including uploading photos.
- Owner: can upload photos through the admin panel (`admin.html`) or drop JPGs into `product-photos/` on GitHub.
So: rows from chat, photo FILES via admin/Claude Code. Never claim a photo is "uploaded" until its URL is saved in `products.images` AND opens.

## Steps to post a product
1. Photo first: upload to bucket `product-images` (or `product-photos/` in the repo). Name it like the product id (lowercase, hyphens, no spaces). Confirm the URL opens.
2. Insert the row (one statement, `id` = slug = lowercase-hyphen name):
```sql
insert into public.products
 (id, category_id, name, price, cost, stock, low_at, featured, active, images, description, slug)
values
 ('example-product-id', <category_id>, 'Exact Product Name', 1999, 1699.15, 1000, 20, true, true,
  array['https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/<file>.jpg'],
  'Plain description.', 'example-product-id');
```
   Find `category_id` with `select id,name,slug from categories order by name;`.
3. Costs: use the 85%-of-price rule ONLY when the owner says so for that batch (`round(price*0.85,2)`). Never invent costs for other items (34 active items have cost 0 — leave until real invoices).
4. Wait for the next `product-pages` run (or start it in Actions), then open `https://stermontarcade.co.ke/p/<slug>.html` and check: photo shows, title/description, price, sitemap entry.

## Rules (from CLAUDE.md, repeated so nothing is missed)
- Never edit generated files: `p/`, `c/`, `guides/`, `blog/index.html`, `sitemap*.xml`. Fix the data or the generator instead.
- Before overwriting any product description, copy the old text into `description_backup`.
- Do not touch product titles/names unless the owner asks.
- Work on a `wip-<task>` branch; merge to `main` only when finished and tested (note-only commits may go straight to `main`).
- Save progress to `HANDOFF-live.md` after each step.

## Quick checks (SQL)
```sql
-- active products with no photo (should be empty)
select id,name from products where active and coalesce(array_length(images,1),0)=0;
-- last 10 posted
select id,name,price,stock,active,images from products order by created_at desc limit 10;
```
