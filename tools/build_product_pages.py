#!/usr/bin/env python3
"""Builds one static, searchable page per active Stermont Arcade product,
plus sitemap-products.xml. Runs in GitHub Actions (see product-pages.yml).
Reads the public catalog from Supabase with the public (publishable) key."""
import html, json, os, re, sys, urllib.request, datetime, pathlib

SITE = "https://stermontarcade.co.ke"
SUPABASE = "https://oewvtbnmyombbtggamor.supabase.co"
KEY = "sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7"  # public by design, read-only under RLS
ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / ".product-pages.json"
TODAY = datetime.date.today().isoformat()

def fetch_products():
    if os.environ.get("PRODUCTS_JSON"):  # for local testing
        return json.load(open(os.environ["PRODUCTS_JSON"], encoding="utf-8"))
    url = (SUPABASE + "/rest/v1/products?select=id,name,price,old_price,stock,images,description,variant_label,categories(name)"
           "&active=eq.true&order=created_at.asc")
    req = urllib.request.Request(url, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def esc(s): return html.escape(str(s), quote=True)
def clean(s): return (s or "").replace("\u200b", "").strip()
def label_fix(l): return re.sub(r"\b1 Litres\b", "1 Litre", l) if l else l
def title_of(p):
    l = label_fix(p.get("variant_label"))
    n = p["name"]
    return n if (not l or l.lower() in n.lower()) else f"{n} {l}"

def render_desc(d):
    out, ul = [], []
    def flush():
        nonlocal ul
        if ul:
            out.append("<ul>" + "".join(f"<li>{esc(x)}</li>" for x in ul) + "</ul>"); ul = []
    for raw in clean(d).split("\n"):
        ln = clean(raw)
        if not ln: flush(); continue
        if ln.startswith(("•", "- ")):
            ul.append(ln.lstrip("•- ").strip()); continue
        flush()
        t = ln.rstrip(":")
        if len(t) <= 32 and ":" not in t and not t[0].isdigit() and not t.endswith((".", ",", "!")) \
           and (ln.endswith(":") or t.isupper() or len(t.split()) <= 3):
            out.append(f"<h3>{esc(t.title() if t.isupper() else t)}</h3>")
        else:
            out.append(f"<p>{esc(ln)}</p>")
    flush()
    return "\n".join(out)

CSS = """
:root{--ink:#1d2420;--mute:#5d6862;--line:#dfe5e0;--bg:#fbfcfb;--accent:#1f5d3a;--accent-ink:#fff;--sale:#a4361f}
@media(prefers-color-scheme:dark){:root{--ink:#e9efeb;--mute:#a3afa8;--line:#2c3631;--bg:#111613;--accent:#58b883;--accent-ink:#0b1710;--sale:#ff8f73}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}
.top{border-bottom:1px solid var(--line);padding:.9rem 1rem}
.top a{font-weight:700;text-decoration:none;color:var(--ink);letter-spacing:.01em}
main{max-width:960px;margin:0 auto;padding:1rem}
nav.crumbs{font-size:.875rem;color:var(--mute);margin:.25rem 0 1rem}
nav.crumbs a{color:var(--mute)}
.grid{display:grid;gap:1.5rem}
@media(min-width:760px){.grid{grid-template-columns:1fr 1fr;align-items:start}}
.hero{width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px}
.thumbs{display:flex;gap:.5rem;margin-top:.5rem;overflow-x:auto}
.thumbs img{width:64px;height:64px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:4px}
h1{font-size:1.5rem;line-height:1.25;margin:0 0 .5rem}
.price{font-size:1.75rem;font-weight:700;margin:.25rem 0}
.was{font-size:1rem;font-weight:400;color:var(--mute);text-decoration:line-through;margin-left:.5rem}
.off{font-size:.9rem;font-weight:600;color:var(--sale);margin-left:.5rem}
.stock{color:var(--accent);font-weight:600;margin:0 0 1rem}
.btn{display:block;text-align:center;background:var(--accent);color:var(--accent-ink);font-weight:700;padding:.9rem 1rem;border-radius:6px;text-decoration:none}
.btn:focus-visible,a:focus-visible{outline:3px solid var(--sale);outline-offset:2px}
.facts{list-style:none;padding:0;margin:1rem 0;color:var(--mute);font-size:.95rem}
.facts li{padding:.2rem 0}
.desc{max-width:68ch;margin-top:2rem}
.desc h3{margin:1.25rem 0 .25rem;font-size:1.05rem}
.desc ul{padding-left:1.2rem}
footer{border-top:1px solid var(--line);margin-top:2.5rem;padding:1rem;color:var(--mute);font-size:.875rem;text-align:center}
"""

def page_html(p, canon_id):
    t = title_of(p)
    cat = (p.get("categories") or {}).get("name") or "Shop"
    price = int(round(float(p["price"])))
    old = int(round(float(p["old_price"]))) if p.get("old_price") else None
    stock = int(p.get("stock") or 0)
    imgs = [u for u in (p.get("images") or []) if u]
    page = f'{SITE}/{p["id"]}.html'
    canon = f"{SITE}/{canon_id}.html"
    order = f'{SITE}/index.html#p-{p["id"]}'
    plain = re.sub(r"\s+", " ", clean(p.get("description")))
    meta = f"Buy {t} in Kenya for KSh {price:,}. Pay by M-Pesa, delivery countrywide from Stermont Arcade."
    offer = {"@type": "Offer", "url": page, "priceCurrency": "KES", "price": str(price),
             "itemCondition": "https://schema.org/NewCondition",
             "availability": "https://schema.org/InStock" if stock > 0 else "https://schema.org/OutOfStock",
             "seller": {"@type": "Organization", "name": "Stermont Arcade", "url": SITE}}
    ld = {"@context": "https://schema.org", "@type": "Product", "name": t, "sku": p["id"],
          "description": plain[:500], "category": cat, "offers": offer}
    if imgs: ld["image"] = imgs
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Stermont Arcade", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": cat, "item": SITE + "/index.html"},
        {"@type": "ListItem", "position": 3, "name": t, "item": page}]}
    sale = ""
    if old and old > price:
        sale = f'<span class="was">KSh {old:,}</span><span class="off">{round((1 - price / old) * 100)}% off</span>'
    hero = (f'<img class="hero" src="{esc(imgs[0])}" alt="{esc(t)}" width="600" height="600" fetchpriority="high">' if imgs else "")
    thumbs = "".join(f'<img src="{esc(u)}" alt="{esc(t)} photo {i+1}" width="64" height="64" loading="lazy">'
                     for i, u in enumerate(imgs)) if len(imgs) > 1 else ""
    og_img = f'<meta property="og:image" content="{esc(imgs[0])}">' if imgs else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{esc(t)} | Buy in Kenya – Stermont Arcade</title>
<meta name="description" content="{esc(meta)}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Stermont Arcade">
<meta property="og:title" content="{esc(t)}">
<meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{canon}">
{og_img}
<meta property="product:price:amount" content="{price}">
<meta property="product:price:currency" content="KES">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(bc, ensure_ascii=False)}</script>
<style>{CSS}</style>
</head>
<body>
<header class="top"><a href="{SITE}/">Stermont Arcade</a></header>
<main>
<nav class="crumbs" aria-label="Breadcrumb"><a href="{SITE}/">Home</a> / <a href="{SITE}/index.html">{esc(cat)}</a> / {esc(t)}</nav>
<div class="grid">
<section aria-label="Photos">
{hero}
<div class="thumbs">{thumbs}</div>
</section>
<section>
<h1>{esc(t)}</h1>
<p class="price">KSh {price:,}{sale}</p>
<p class="stock">{"In stock" if stock > 0 else "Out of stock"}</p>
<a class="btn" href="{order}">Order on Stermont Arcade</a>
<ul class="facts">
<li>Pay by M-Pesa</li>
<li>Delivery to all 47 counties</li>
<li>Category: {esc(cat)}</li>
</ul>
</section>
</div>
<section class="desc" aria-label="Product details">
{render_desc(p.get("description"))}
</section>
</main>
<footer>Stermont Arcade, Kenya. Questions? support@stermontarcade.co.ke</footer>
<script src="/analytics.js" defer></script>
</body>
</html>
"""

def main():
    products = fetch_products()
    if not products:
        print("No active products returned; leaving the site unchanged."); return 0
    seen, canon_of = {}, {}
    for p in products:  # identical title + description = duplicate listing: point to the first
        key = (title_of(p).lower(), re.sub(r"\s+", " ", clean(p.get("description"))).lower())
        canon_of[p["id"]] = seen.setdefault(key, p["id"])
    old = set(json.load(open(MANIFEST))) if MANIFEST.exists() else set()
    new, urls = set(), []
    for p in products:
        fn = f'{p["id"]}.html'
        (ROOT / fn).write_text(page_html(p, canon_of[p["id"]]), encoding="utf-8")
        new.add(fn)
        if canon_of[p["id"]] == p["id"]: urls.append(f'{SITE}/{fn}')
    for fn in old - new:  # product hidden or removed: delete its page
        f = ROOT / fn
        if f.exists(): f.unlink()
    sm = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"<url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    (ROOT / "sitemap-products.xml").write_text(sm, encoding="utf-8")
    MANIFEST.write_text(json.dumps(sorted(new), indent=1), encoding="utf-8")
    print(f"{len(new)} pages, {len(urls)} in sitemap, {len(old - new)} removed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
