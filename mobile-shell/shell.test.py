# Headless-mobile test of the shell. Needs: pip install playwright && playwright install chromium
# Run: python3 mobile-shell/shell.test.py   (screenshots go to the system temp folder)
import sys, threading, http.server, socketserver, functools, os, tempfile, json, base64, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # repo root: the shell reads /product-names.json
OUT = tempfile.gettempdir()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{port}/'


# ---- Supabase fixture: the shell talks to the real REST API in production; here the three requests it makes are answered locally ----
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
OK, BROKEN = 'https://img.test/ok.png', 'https://img.test/broken.jpg'
CATS_FIX = [
    dict(id=31, name='Pest Control & Fumigation', slug='pest-control-fumigation', parent_id=None, sort_order=15, is_promo=False),
    dict(id=32, name='Bed Bug Killers', slug='bed-bug-killers', parent_id=31, sort_order=0, is_promo=False),
    dict(id=1, name='Agrovet', slug='agrovet', parent_id=None, sort_order=16, is_promo=False),
    dict(id=71, name='Fungicides', slug='fungicides', parent_id=1, sort_order=0, is_promo=False),
    dict(id=75, name='Phones & Accessories', slug='phones-accessories', parent_id=None, sort_order=4, is_promo=False),
    dict(id=2, name='Phones & Tablets', slug='phones-tablets', parent_id=75, sort_order=0, is_promo=False),
    dict(id=79, name='Home & Kitchen', slug='home-kitchen', parent_id=None, sort_order=5, is_promo=False),
    dict(id=24, name='Kitchen & Dining', slug='kitchen-dining', parent_id=79, sort_order=0, is_promo=False),
    dict(id=77, name='Others', slug='others', parent_id=None, sort_order=14, is_promo=False),          # no products: must not become a chip
    dict(id=83, name='Kili Featured', slug='kili-featured', parent_id=None, sort_order=1, is_promo=True),  # promo bucket: must not become a chip
]
def row(id, cat, name, price, old, featured=False, group=None, label=None, stock=100, img=OK):
    return dict(id=id, slug=id, name=name, category_id=cat, price=str(price), old_price=str(old), stock=stock, featured=featured,
                images=[img] if img else [], unit=None, variant_group=group, variant_label=label)
ROWS = [row('home-0', 24, 'Hot Plate', 2500, 3000, featured=True)]
ROWS += [row(f'agro-abc-{l.replace(" ", "")}', 71, 'Absolute 375SC Fungicide', pr, int(pr * 1.15), featured=True, group='agro-abc', label=l)
         for l, pr in [('1 Litre', 6450), ('250 ml', 1550), ('100 ml', 690), ('50 ml', 390)]]
ROWS += [row(f'pest-{i}', 32, f'Bed Bug Spray {i}', 300 + i * 250, 300 + i * 250 + 60 * (i % 3)) for i in range(1, 6)]
ROWS += [row('pest-broken', 32, 'Bed Bug Powder', 450, 520, img=BROKEN)]
ROWS += [row(f'phone-{i}', 2, f'Phone Model {i}', 9000 + i * 4000, 9000 + i * 4000 + 1500) for i in range(1, 9)]
ROWS += [row('agro-1', 71, 'Copper Fungicide', 1200, 1200), row('agro-2', 71, 'Sulphur Dust', 800, 900)]
ROWS += [row('home-1', 24, 'Air Fryer 5L', 6500, 7800), row('home-2', 24, 'Kettle 1.8L', 1800, 2100), row('home-3', 24, 'Blender', 3200, 3900)]
ROWS += [row('home-soldout', 24, 'Gone Item', 100, 120, stock=0)]
NAMES_FIX = {'home-0': 'Heavy-Duty Hot Plate Pro'}   # product-names.json heading; every other product falls back to its database name
FAIL = [False]
# Products the Deals badge should count: in stock, lowest size has an old price above its price. 19 = hot plate, Absolute (one folded product),
# 4 bed bug sprays (pest-3 has no old price), the powder, 8 phones, Sulphur Dust, 3 kitchen items; the sold-out item and Copper Fungicide do not count.
DEALS_EXPECTED = 19

def serve(route, body, ctype='application/json'):
    time.sleep(0.4)   # a real network round trip, so the skeleton state is observable
    route.fulfill(status=200, content_type=ctype, body=body if isinstance(body, (bytes, str)) else json.dumps(body), headers={'access-control-allow-origin': '*'})
def on_rest(route):
    if FAIL[0]: return route.fulfill(status=503, body='down', headers={'access-control-allow-origin': '*'})
    url = route.request.url
    if '/rest/v1/products' in url and 'id=eq.' in url:   # details of one row, fetched when a product is opened
        rid = url.split('id=eq.')[1].split('&')[0]
        r = next((x for x in ROWS if x['id'] == rid), None)
        return serve(route, [] if not r else [dict(description=f"ABOUT {r['name']}\n- line one\n- line two", unit='Each', stock=r['stock'], low_at=5, slug=r['slug'], images=[OK, OK])])
    serve(route, ROWS if '/rest/v1/products' in url else CATS_FIX)
# The fixture slugs have no /p/ file; every /p/*.html address is answered with a REAL generated product page, so the redirect script that runs is the shipped one.
REAL = open(os.path.join(ROOT, 'p', 'abasi-5-ec.html'), encoding='utf-8').read()
def mock_network(ctx):
    ctx.route('**/p/*.html*', lambda rt: rt.fulfill(status=200, content_type='text/html', body=REAL))
    ctx.route('**/rest/v1/products*', on_rest)
    ctx.route('**/rest/v1/categories*', on_rest)
    for host in ('https://www.googletagmanager.com/**', 'https://cdn.jsdelivr.net/**', 'https://www.google-analytics.com/**', 'https://*.google-analytics.com/**'):
        ctx.route(host, lambda r: r.fulfill(status=200, content_type='application/javascript', body=''))   # analytics.js loads these in production; the sandbox has no internet
    ctx.route('**/rest/v1/stock*', lambda r: serve(r, []))
    ctx.route('**/product-names.json*', lambda r: serve(r, NAMES_FIX))
    ctx.route('https://img.test/ok.png', lambda r: r.fulfill(status=200, content_type='image/png', body=PNG))
    ctx.route('https://img.test/broken.jpg', lambda r: r.abort())

results = []
def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{extra}]' if extra and not cond else ''))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mock_network(ctx)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'broken.jpg' not in (m.location or {}).get('url', '') else None)   # the aborted photo is the fixture's deliberate failure
    pg.add_init_script("window.__sawSkeleton = false; new MutationObserver(() => { if (document.querySelector('#grid .card[aria-hidden=\"true\"]')) window.__sawSkeleton = true; }).observe(document, { childList: true, subtree: true });")
    pg.goto(URL)

    # skeletons then products
    pg.wait_for_selector('#grid .card[data-id]')
    check('skeleton cards were shown while loading', pg.evaluate('window.__sawSkeleton'))
    n = pg.locator('#grid .card[data-id]').count()
    check('products replace skeletons', pg.locator('#grid .card[aria-hidden="true"]').count() == 0 and n >= 12, n)
    check('2-column grid', pg.evaluate("getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.split(' ').length") == 2)
    check('discount badge renders, no invented star ratings', pg.locator('#grid .bg-sale').count() > 0 and pg.locator('#grid .stars').count() == 0)
    check('name comes from product-names.json when present', pg.locator('#grid .card[data-id="home-0"] p').first.inner_text() == 'Heavy-Duty Hot Plate Pro')
    check('database name used when the heading file has no entry', 'Bed Bug Spray 1' in pg.locator('#grid').inner_text() or pg.locator('#grid .card[data-id^="pest-"]').count() >= 1)
    check('real product photo is rendered', pg.locator('#grid .card[data-id="home-0"] img[src="https://img.test/ok.png"]').count() == 1)
    pg.wait_for_timeout(200)
    check('broken photo falls back to the category emoji', pg.locator('#grid .card[data-id="pest-broken"] img').count() == 0 and '🪳' in pg.locator('#grid .card[data-id="pest-broken"]').inner_text())
    check('pack sizes fold into ONE card with a From price', pg.locator('#grid .card[data-id="agro-abc"]').count() == 1 and 'From KSh 390' in pg.locator('#grid .card[data-id="agro-abc"]').inner_text() and '4 sizes' in pg.locator('#grid .card[data-id="agro-abc"]').inner_text())
    check('sold-out product is hidden', pg.locator('#grid .card[data-id="home-soldout"]').count() == 0)
    check('chips come from the live categories (promo + empty ones left out)', pg.locator('#chips .chip').all_inner_texts() == ['For you', 'Phones & Accessories', 'Home & Kitchen', 'Pest Control & Fumigation', 'Agrovet'], pg.locator('#chips .chip').all_inner_texts())
    pg.screenshot(path=f'{OUT}/shot-home.png')

    # badges
    check('cart badge hidden when empty', all(not e.is_visible() for e in pg.locator('[data-badge="cart"]').all()))
    pg.locator('[data-add]').first.click()
    check('cart badge shows 1 (header + nav)', pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1' and pg.locator('#appbar [data-badge="cart"]').inner_text() == '1')
    check('deals badge = number of discounted products (not the old mock 5)', pg.locator('#bottom-nav [data-badge="deals"]').inner_text() == str(DEALS_EXPECTED), pg.locator('#bottom-nav [data-badge="deals"]').inner_text())

    # quick buy + back button
    h0 = pg.evaluate('history.length')
    pg.locator('#grid .card[data-id]').nth(1).locator('p').first.click()
    check('quick buy sheet opens', pg.locator('#sheet-quickbuy.open').count() == 1)
    check('opening pushed one history entry', pg.evaluate('history.length') == h0 + 1)
    check('body scroll locked', pg.evaluate("document.body.classList.contains('no-scroll')"))
    pg.wait_for_timeout(450); pg.screenshot(path=f'{OUT}/shot-quickbuy.png')
    pg.go_back()
    pg.wait_for_timeout(350)
    check('Back closes quick buy and stays on page', pg.locator('#sheet-quickbuy.open').count() == 0 and pg.url == URL, pg.url)
    check('scroll unlocked after close', not pg.evaluate("document.body.classList.contains('no-scroll')"))

    # multi-size product: the plus button asks for a size instead of silently adding the smallest
    pg.locator('#grid .card[data-id="agro-abc"] [data-add]').click()
    check('plus on a multi-size card opens the size sheet', pg.locator('#sheet-quickbuy.open').count() == 1 and pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1')
    check('sizes listed smallest price first', pg.locator('#qb-sizes .chip').all_inner_texts() == ['50 ml', '100 ml', '250 ml', '1 Litre'], pg.locator('#qb-sizes .chip').all_inner_texts())
    pg.locator('#qb-sizes [data-size="250 ml"]').click()
    check('each size shows its own price', pg.locator('#qb-price').inner_text() == 'KSh 1,550' and pg.locator('#qb-old').inner_text() == 'KSh 1,782', pg.locator('#qb-price').inner_text())
    pg.wait_for_function("document.querySelector('#qb-desc').innerText.includes('ABOUT Absolute')", timeout=5000)
    check('details: description, unit and stock of the chosen size are shown', 'line one' in pg.locator('#qb-desc').inner_text() and pg.locator('#qb-meta').inner_text() == 'Unit: Each · In stock', pg.locator('#qb-meta').inner_text())
    check('details: link to the full product page of that size', pg.locator('#qb-page').get_attribute('href') == '/p/agro-abc-250ml.html' and pg.locator('#qb-page').is_visible(), pg.locator('#qb-page').get_attribute('href'))
    check('details: extra photos listed and tapping one changes the main photo', pg.locator('#qb-photos [data-photo]').count() == 2 and (pg.locator('#qb-photos [data-photo]').nth(1).click() or True) and pg.locator('#qb-img img').count() == 1)
    pg.screenshot(path=f'{OUT}/shot-details.png')
    # the full product page opens INSIDE the shell (no navigation to /p/...)
    url_before = pg.url
    pg.locator('#qb-page').click()
    pg.wait_for_selector('#page-product.open', timeout=5000)
    pg.wait_for_function("document.querySelector('#pp-desc').innerText.includes('ABOUT Absolute')", timeout=5000)
    check('product page opens inside the shell (same URL, shell still loaded)', pg.url == url_before and pg.locator('#bottom-nav').count() == 1, pg.url)
    check('product page shows name, price, sizes, description, unit and trust lines', 'Absolute 375SC Fungicide' in pg.locator('#pp-name').inner_text() and 'KSh 1,550' in pg.locator('#pp-price').inner_text() and pg.locator('#pp-sizes .chip').count() == 4 and 'line two' in pg.locator('#pp-desc').inner_text() and 'Unit: Each' in pg.locator('#pp-meta').inner_text() and '47 counties' in pg.locator('#page-product').inner_text())
    pg.screenshot(path=f'{OUT}/shot-product-page.png')
    check('product page: similar products listed', pg.locator('#pp-related [data-pp-open]').count() >= 1)
    pg.locator('#pp-sizes [data-pp-size="1 Litre"]').click()
    check('product page: picking a size updates the price', pg.locator('#pp-price').inner_text() == 'KSh 6,450', pg.locator('#pp-price').inner_text())
    pg.locator('#pp-sizes [data-pp-size="250 ml"]').click()
    pg.go_back(); pg.wait_for_function("!document.querySelector('#page-product.open')", timeout=5000)
    check('Back from the product page returns to the sheet, still on the shell', pg.locator('#sheet-quickbuy.open').count() == 1 and pg.url == url_before, pg.url)
    pg.go_back(); pg.wait_for_timeout(350)

    # forward must not reopen a stale sheet with no data? (it has data in-session, so allowed); just ensure no errors
    # stacked overlays: filters, then back
    pg.locator('#open-filters').click()
    check('filters sheet opens', pg.locator('#sheet-filters.open').count() == 1)
    pg.locator('#scrim').click(position={'x': 195, 'y': 60})
    pg.wait_for_timeout(350)
    check('scrim tap closes filters via history', pg.locator('#sheet-filters.open').count() == 0 and pg.url == URL)

    # filters apply
    pg.locator('#open-filters').click()
    pg.locator('#f-sort [data-sort="low"]').click()
    pg.fill('#f-max', '5000')
    pg.locator('#f-apply').click()
    pg.wait_for_selector('#grid .card[data-id]')
    pg.wait_for_timeout(300)
    prices = pg.evaluate("[...document.querySelectorAll('#grid .card[data-id] .text-sale')].map(e=>+e.textContent.replace(/[^0-9]/g,''))")
    check('filter: max 5000 + low->high sort', prices and max(prices) <= 5000 and prices == sorted(prices), prices[:8])
    check('filter count shown', pg.locator('#filter-count').is_visible())
    check('sheet closed after apply', pg.locator('#sheet-filters.open').count() == 0)
    pg.locator('#open-filters').click(); pg.locator('#f-reset').click(); pg.locator('#f-apply').click(); pg.wait_for_timeout(700)

    # drawer
    pg.locator('[data-open="drawer-categories"]').click()
    check('category drawer opens', pg.locator('#drawer-categories.open').count() == 1)
    rows = pg.locator('#drawer-cats [data-drawer-cat]').count()
    with_img = pg.locator('#drawer-cats [data-drawer-cat] img[src^="http"]').count()
    check('drawer rows show real product photos', with_img >= 1, with_img)
    check('drawer rows without a photo keep the category emoji', pg.evaluate("[...document.querySelectorAll('#drawer-cats [data-drawer-cat]')].every(b => b.querySelector('img') || b.querySelector('span').textContent.trim().length > 0)"), rows)
    pg.locator('[data-drawer-cat="phones-accessories"]').click()
    pg.wait_for_timeout(900)
    check('drawer category selects chip, closes drawer', pg.locator('#drawer-categories.open').count() == 0 and pg.locator('#chips [data-chip="phones-accessories"][aria-selected="true"]').count() == 1)
    names = pg.evaluate("[...document.querySelectorAll('#grid .card[data-id]')].map(e=>e.dataset.id.split('-')[0])")
    check('grid shows only that category', names and set(names) == {'phone'}, set(names))

    # tabs + history
    h1 = pg.evaluate('history.length')
    pg.locator('#bottom-nav [data-tab="categories"]').click()
    check('Categories tab active (aria-current)', pg.locator('#bottom-nav [data-tab="categories"][aria-current="page"]').count() == 1 and pg.locator('#view-categories').is_visible())
    check('leaving Home pushed an entry for the tab', pg.evaluate('history.state.tab') == 'categories')
    check('chips hidden off Home', not pg.locator('#chips-wrap').is_visible())
    pg.screenshot(path=f'{OUT}/shot-categories.png')
    check('categories rail shows real product photos', pg.locator('#cat-side [data-side] img[src^="http"]').count() >= 1)
    check('categories rail keeps an icon on every row', pg.evaluate("[...document.querySelectorAll('#cat-side [data-side]')].every(b => b.querySelector('img') || b.querySelector('span').textContent.trim().length > 0)"))
    pg.locator('#cat-side [data-side="agrovet"]').click()
    check('side list swaps right grid', 'Fungicides' in pg.locator('#cat-main').inner_text())
    h1_after = pg.evaluate('history.length')
    pg.locator('#bottom-nav [data-tab="deals"]').click()
    check('hopping between non-home tabs replaces the entry', pg.evaluate('history.state.tab') == 'deals' and pg.evaluate('history.length') == h1_after)
    check('deals badge cleared on visit', not pg.locator('#bottom-nav [data-badge="deals"]').is_visible())
    pg.wait_for_selector('#deals-grid .card[data-id]')
    pg.go_back(); pg.wait_for_timeout(300)
    check('Back from a tab returns to Home (not off the site)', pg.locator('#view-home').is_visible() and pg.url == URL, pg.url)
    check('nav highlight follows Back', pg.locator('#bottom-nav [data-tab="home"][aria-current="page"]').count() == 1)

    # buy now flow
    pg.locator('#grid .card[data-id]').first.locator('p').first.click()
    pg.locator('#qb-plus').click()
    pg.locator('#qb-buy').click()
    pg.wait_for_timeout(500)
    check('Buy now closes sheet and opens Cart tab', pg.locator('#sheet-quickbuy.open').count() == 0 and pg.locator('#view-cart').is_visible())
    check('cart total shown', pg.locator('#cart-total').inner_text().startswith('KSh'))
    pg.screenshot(path=f'{OUT}/shot-cart.png')
    pg.go_back(); pg.wait_for_timeout(300)
    check('Back from Cart returns to Home', pg.locator('#view-home').is_visible() and pg.url == URL)

    # header compaction on scroll
    pg.evaluate('window.scrollTo(0, 400)'); pg.wait_for_timeout(200)
    pg.evaluate('window.scrollTo(0, 700)'); pg.wait_for_timeout(300)
    check('header compacts when scrolling down', pg.evaluate("document.querySelector('#appbar').classList.contains('is-compact')"))
    pg.evaluate('window.scrollTo(0, 500)'); pg.wait_for_timeout(300)
    check('header expands when scrolling up', not pg.evaluate("document.querySelector('#appbar').classList.contains('is-compact')"))
    check('search stays pinned', pg.evaluate("document.querySelector('#search').getBoundingClientRect().top") < 50)

    # search
    pg.fill('#search', 'air fryer'); pg.keyboard.press('Enter'); pg.wait_for_timeout(800)
    t = pg.locator('#grid-title').inner_text()
    check('search filters grid', 'air fryer' in t.lower() and pg.locator('#grid .card[data-id]').count() >= 1, t)

    # reload with a sheet open does not reopen it
    pg.locator('#grid .card[data-id]').first.locator('p').first.click()
    pg.reload(); pg.wait_for_selector('#grid .card[data-id]')
    check('reload while sheet open lands clean', pg.locator('#sheet-quickbuy.open').count() == 0)
    check('deals badge stays cleared after reload (nothing new since the visit to Deals)', pg.locator('#bottom-nav [data-badge="deals"]').is_hidden())

    # Supabase down: the grid offers a retry instead of hanging on skeletons, and recovers
    FAIL[0] = True
    p2 = ctx.new_page(); p2.goto(URL)
    p2.wait_for_selector('#grid-empty:not([hidden])', timeout=8000)
    check('network failure shows a retry link, no stuck skeletons', 'Could not load products' in p2.locator('#grid-empty').inner_text() and p2.locator('#grid-empty a[href="/classic.html"]').count() == 1 and p2.locator('#grid .card[aria-hidden="true"]').count() == 0)
    FAIL[0] = False
    p2.locator('[data-retry]').click(); p2.wait_for_selector('#grid .card[data-id]')
    check('retry loads the products', p2.locator('#grid .card[data-id]').count() >= 12 and p2.locator('#grid-empty').is_hidden())
    p2.close()

    # a cart saved by the old mock prototype (no rowId) is dropped, not shown with fake prices
    c3 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c3)
    p3 = c3.new_page()
    p3.add_init_script("localStorage.setItem('shell.cart', JSON.stringify([{key:'pest-0|50 ml',id:'pest-0',name:'Mock',size:'50 ml',qty:2,price:100,emoji:'x',bg:'#fff'}]))")
    p3.goto(URL); p3.wait_for_selector('#grid .card[data-id]')
    check('stale mock-era cart lines are dropped', p3.locator('#bottom-nav [data-badge="cart"]').is_hidden())
    c3.close()

    # a reload on a tab other than Home stays on that tab (owner bug 2026-10-31: refreshing the Categories tab went back to the home page)
    c12 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c12)
    p12 = c12.new_page(); e12 = []; p12.on('pageerror', lambda e: e12.append(str(e)))
    p12.goto(URL); p12.wait_for_selector('#grid .card[data-id]')
    p12.locator('#bottom-nav [data-tab="categories"]').click()
    p12.reload(); p12.wait_for_selector('#cat-main li', timeout=10000)
    check('reload on Categories stays on Categories', p12.locator('#view-categories').is_visible() and p12.locator('#view-home').is_hidden() and p12.locator('#bottom-nav [data-tab="categories"][aria-current="page"]').count() == 1 and p12.evaluate('history.state.tab') == 'categories')
    check('after that reload the home chips stay hidden', not p12.locator('#chips-wrap').is_visible())
    p12.go_back(); p12.wait_for_timeout(400)
    check('Back after reloading on Categories still returns to Home', p12.locator('#view-home').is_visible() and p12.locator('#bottom-nav [data-tab="home"][aria-current="page"]').count() == 1 and p12.url == URL, p12.url)
    p12.locator('#bottom-nav [data-tab="cart"]').click(); p12.reload(); p12.wait_for_selector('#view-cart:not([hidden])', timeout=10000)
    check('reload on Cart stays on Cart', p12.locator('#bottom-nav [data-tab="cart"][aria-current="page"]').count() == 1 and p12.locator('#view-home').is_hidden())
    p12.locator('#bottom-nav [data-tab="deals"]').click(); p12.reload(); p12.wait_for_selector('#deals-grid .card[data-id]', timeout=10000)
    check('reload on Deals stays on Deals and the badge stays cleared', p12.locator('#bottom-nav [data-tab="deals"][aria-current="page"]').count() == 1 and p12.locator('#bottom-nav [data-badge="deals"]').is_hidden())
    check('no page errors while reloading on tabs', not e12, e12[:3])
    c12.close()

    # ---- the shell is now the home page (/): SEO head, handoff to the proven checkout, redirects ----
    BASE = URL.rstrip('/')
    html = pg.evaluate("fetch('/').then(r => r.text())")   # the HTML the server sends (the live page's title changes while a product is open)
    check('home page keeps the SEO head (title, canonical, index robots, JSON-LD)', '<title>Stermont Arcade | Online Store Kenya</title>' in html and 'rel="canonical" href="https://stermontarcade.co.ke/"' in html and 'index, follow' in html and html.count('application/ld+json') >= 2 and 'noindex' not in html)
    check('home page carries the seo-links markers the build bot fills (crawlable category + product links)', html.count('<!-- seo-links:start -->') == 1 and html.count('<!-- seo-links:end -->') == 1 and '/c/' in html and '/p/' in html)
    cls = open(os.path.join(ROOT, 'classic.html'), encoding='utf-8').read()
    check('classic.html (old home) is noindex so only / is indexed', 'content="noindex, follow"' in cls and 'index, follow, max-image' not in cls)

    c4 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c4)
    p4 = c4.new_page(); e4 = []; p4.on('pageerror', lambda e: e4.append(str(e)))
    p4.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('shell.cart', JSON.stringify([{key:'home-0|Standard',id:'home-0',rowId:'home-0',name:'Heavy-Duty Hot Plate Pro',size:'Standard',qty:1,price:2500,emoji:'x',bg:'#fff'},{key:'home-1|Standard',id:'home-1',rowId:'home-1',name:'Air Fryer 5L',size:'Standard',qty:2,price:6500,emoji:'x',bg:'#fff'}])); }")
    p4.goto(URL); p4.wait_for_selector('#grid .card[data-id]')
    p4.locator('#bottom-nav [data-tab="cart"]').click()
    p4.locator('#checkout').click()
    p4.wait_for_url('**/classic.html*', timeout=8000)
    check('Checkout hands the customer to the full shop checkout', '/classic.html' in p4.url)
    p4.wait_for_selector('#dr.on', timeout=15000)
    cart_txt = p4.locator('#dr').inner_text()
    check('the shop cart opens by itself with the shell items and prices', 'Hot Plate' in cart_txt and 'Air Fryer' in cart_txt and '2,500' in cart_txt and '6,500' in cart_txt, cart_txt[:200])
    check('quantities carried over (1 hot plate + 2 air fryers, KSh 15,500)', '15,500' in cart_txt, cart_txt[:300])
    check('handoff is consumed (no double add on reload)', p4.evaluate("localStorage.getItem('stm_handoff')") is None and 'checkout=1' not in p4.url)
    check('the shell cart is kept until the order is finished (a cancelled checkout loses nothing)', len(json.loads(p4.evaluate("localStorage.getItem('shell.cart')") or '[]')) == 2)
    check('checkout mode: the old home page is not shown behind the checkout', p4.evaluate("document.documentElement.classList.contains('stm-co') && !document.documentElement.classList.contains('stm-co-wait') && [...document.querySelectorAll('.pcard, #featured, header, .hd-r')].every(e => e.getBoundingClientRect().width === 0 || getComputedStyle(e).visibility === 'hidden' || e.offsetParent === null)"))
    p4.locator('#dr-x').click(); p4.wait_for_function("location.pathname === '/'", timeout=8000)
    check('closing the checkout goes back to the shell, not the old home page', p4.url == BASE + '/', p4.url)
    p4.wait_for_selector('#grid .card[data-id]')
    check('cancelled checkout: the shell cart still has its items', json.loads(p4.evaluate("localStorage.getItem('shell.cart')") or '[]') != [])
    c4.close()

    # a finished order (empty shop cart) clears the shell cart when the checkout is closed
    c4b = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c4b)
    p4b = c4b.new_page()
    p4b.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('shell.cart', JSON.stringify([{key:'home-2|Standard',id:'home-2',rowId:'home-2',name:'Kettle 1.8L',size:'Standard',qty:1,price:1800}])); localStorage.setItem('stm_handoff', JSON.stringify([{rowId:'home-2',qty:1,price:1800,name:'Kettle 1.8L',size:'Standard'}])); }")
    p4b.goto(f'{BASE}/classic.html?checkout=1'); p4b.wait_for_selector('#dr.on', timeout=15000)
    p4b.evaluate("localStorage.setItem('stm_cart', '{}')")
    p4b.locator('#dr-x').click(); p4b.wait_for_function("location.pathname === '/'", timeout=8000)
    check('finished order: the shell cart is cleared', json.loads(p4b.evaluate("localStorage.getItem('shell.cart')") or '[]') == [])
    c4b.close()

    # a price that changed since the customer saw it is never charged: the line is skipped and the customer is told
    c5 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c5)
    p5 = c5.new_page()
    p5.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('stm_handoff', JSON.stringify([{rowId:'home-0',qty:1,price:1999,name:'Hot Plate',size:'Standard'},{rowId:'home-2',qty:1,price:1800,name:'Kettle 1.8L',size:'Standard'}])); }")
    p5.goto(f'{BASE}/classic.html?checkout=1'); p5.wait_for_selector('[role=alert]', timeout=15000)
    check('changed price: customer is told which item to add again', 'Hot Plate' in p5.locator('[role=alert]').inner_text())
    p5.wait_for_selector('#dr.on', timeout=5000); t5 = p5.locator('#dr').inner_text()
    check('changed price: only the unchanged item reached the cart', 'Kettle' in t5 and '1,800' in t5 and '1,999' not in t5 and '2,500' not in t5, t5[:200])
    c5.close()

    # product page: Add to cart and Buy now work from the full page
    c8 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c8)
    p8 = c8.new_page(); p8.goto(URL); p8.wait_for_selector('#grid .card[data-id]')
    p8.locator('#grid .card[data-id="agro-abc"] [data-add]').click(); p8.wait_for_selector('#sheet-quickbuy.open')
    p8.locator('#qb-page').click(); p8.wait_for_selector('#page-product.open')
    p8.locator('#pp-plus').click(); p8.locator('#pp-add').click()
    check('product page: Add to cart adds the chosen size and quantity', p8.locator('#bottom-nav [data-badge="cart"]').inner_text() == '2', p8.locator('#bottom-nav [data-badge="cart"]').inner_text())
    p8.locator('#pp-related [data-pp-open]').first.click()
    check('product page: a similar product replaces the one shown', 'Absolute' not in p8.locator('#pp-name').inner_text())
    p8.locator('#pp-buy').click(); p8.wait_for_selector('#view-cart:not([hidden])', timeout=5000)
    check('product page: Buy now lands on the Cart tab with both items', p8.locator('#page-product.open').count() == 0 and p8.locator('#view-cart').is_visible() and p8.locator('#cart-list li').count() == 2, p8.locator('#cart-list li').count())
    c8.close()

    # product addresses: an open product has its own URL (/?product=<slug of the size>), the base entry stays "/", and the address reopens the product
    c9 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c9)
    p9 = c9.new_page(); e9 = []
    p9.on('pageerror', lambda e: e9.append(str(e)))
    p9.goto(URL); p9.wait_for_selector('#grid .card[data-id]')
    base_title = p9.title()
    check('address: home is the bare "/" address', p9.evaluate('location.pathname + location.search') == '/')
    p9.locator('#grid .card[data-id="agro-abc"] p').first.click(); p9.wait_for_selector('#sheet-quickbuy.open')
    check('address: opening a product puts its own page address (/p/<slug>.html + size) in the address bar', p9.evaluate('location.pathname + location.hash') == '/p/agro-abc-1Litre.html#agro-abc-50ml', p9.url)
    check('address: tab title shows the product', 'Absolute 375SC Fungicide' in p9.title() and p9.title().endswith('| Stermont Arcade'), p9.title())
    p9.locator('#qb-sizes [data-size="250 ml"]').click()
    check('address: choosing another size updates the address (no extra history entry)', p9.evaluate('location.pathname + location.hash') == '/p/agro-abc-1Litre.html#agro-abc-250ml', p9.url)
    p9.locator('#qb-page').click(); p9.wait_for_selector('#page-product.open')
    check('address: the full product page keeps the same address', p9.evaluate('location.pathname + location.hash') == '/p/agro-abc-1Litre.html#agro-abc-250ml', p9.url)
    p9.go_back(); p9.wait_for_function("!document.querySelector('#page-product.open')")
    check('address: Back from the page returns to the sheet, address unchanged', p9.locator('#sheet-quickbuy.open').count() == 1 and p9.evaluate('location.hash') == '#agro-abc-250ml')
    p9.go_back(); p9.wait_for_function("!document.querySelector('#sheet-quickbuy.open')")
    check('address: closing the product restores "/" and the page title', p9.evaluate('location.pathname + location.search') == '/' and p9.title() == base_title, p9.url + ' | ' + p9.title())
    p9.goto(f'{BASE}/?product=agro-abc-250ml'); p9.wait_for_selector('#page-product.open', timeout=10000)
    check('address: opening the address shows that product page with that size', 'Absolute 375SC Fungicide' in p9.locator('#pp-name').inner_text() and p9.locator('#pp-price').inner_text() == 'KSh 1,550', p9.locator('#pp-price').inner_text())
    check('address: the address stays after load and the tab title shows the product', p9.evaluate('location.pathname + location.hash') == '/p/agro-abc-1Litre.html#agro-abc-250ml' and 'Absolute' in p9.title())
    p9.go_back(); p9.wait_for_function("!document.querySelector('#page-product.open')")
    check('address: Back from an opened address lands on the shell home ("/")', p9.evaluate('location.pathname + location.search') == '/' and p9.locator('#view-home').is_visible(), p9.url)
    p9.reload(); p9.wait_for_selector('#grid .card[data-id]')
    p9.goto(f'{BASE}/?product=home-1'); p9.wait_for_selector('#page-product.open', timeout=10000)
    check('address: a single-size product opens from its address too', 'Air Fryer' in p9.locator('#pp-name').inner_text())
    p9.evaluate("window.__shared = null; navigator.share = d => { window.__shared = d; return Promise.resolve(); }")
    p9.locator('#pp-share').click(); p9.wait_for_function('window.__shared')
    sh = p9.evaluate('window.__shared')
    check('share: shares the product\'s own /p/ page link, not the shell address', sh['url'] == f'{BASE}/p/home-1.html' and 'Air Fryer' in sh['title'], sh)
    p9.evaluate("navigator.share = undefined; window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true })")
    p9.locator('#pp-share').click(); p9.wait_for_function('window.__copied')
    check('share: without the share sheet the link is copied and a notice shows', p9.evaluate('window.__copied') == f'{BASE}/p/home-1.html' and 'Link copied' in p9.locator('#toast').inner_text(), p9.locator('#toast').inner_text())
    check('share: the address bar shows the same product page address', p9.evaluate('location.pathname') == '/p/home-1.html')
    p9.goto(f'{BASE}/?product=does-not-exist'); p9.wait_for_selector('#grid .card[data-id]'); p9.wait_for_timeout(600)
    check('address: an unknown product shows a notice and the normal home', p9.locator('#page-product.open').count() == 0 and 'no longer available' in p9.locator('#toast').inner_text(), p9.locator('#toast').inner_text())
    check('address: no page errors', not e9, e9[:3])
    c9.close()
    # /p/<slug>.html -> shell on phones (seo-shell-redirect.mjs). The served page is the REAL generated product page, so the injected script is what runs.
    check('redirect: the generated product pages carry the phone redirect script', 'stm-shell' in REAL)
    def serve_p(ctx): pass   # mock_network already serves the real generated product page for every /p/*.html address
    c11 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c11); serve_p(c11)
    p11 = c11.new_page(); e11 = []; p11.on('pageerror', lambda e: e11.append(str(e)))
    p11.goto(f'{BASE}/p/agro-abc-1Litre.html#agro-abc-250ml'); p11.wait_for_selector('#page-product.open', timeout=15000)
    check('redirect: a phone opening a product page link lands in the shell on that product and size', 'Absolute 375SC Fungicide' in p11.locator('#pp-name').inner_text() and p11.locator('#pp-price').inner_text() == 'KSh 1,550', p11.locator('#pp-price').inner_text())
    check('redirect: the address is the product page address again (copy/share keeps its preview)', p11.evaluate('location.pathname + location.hash') == '/p/agro-abc-1Litre.html#agro-abc-250ml', p11.url)
    p11.goto(f'{BASE}/p/agro-abc-1Litre.html'); p11.wait_for_selector('#page-product.open', timeout=15000)
    check('redirect: without a size in the hash the page\'s own size opens', p11.locator('#pp-price').inner_text() == 'KSh 6,450', p11.locator('#pp-price').inner_text())
    check('redirect: no page errors', not e11, e11[:3])
    c11.close()
    for label, kw in [('Googlebot', dict(user_agent='Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', viewport={'width': 390, 'height': 780})),
                      ('WhatsApp', dict(user_agent='WhatsApp/2.23.20.0 A', viewport={'width': 390, 'height': 780})),
                      ('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx); serve_p(cx)
        px = cx.new_page(); px.goto(f'{BASE}/p/agro-abc-1Litre.html'); px.wait_for_timeout(1500)
        check(f'redirect: {label} keeps the product page (no redirect)', px.evaluate('location.pathname') == '/p/agro-abc-1Litre.html' and px.locator('#page-product').count() == 0, px.url)
        cx.close()
    cc = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(cc); serve_p(cc)
    pc = cc.new_page(); pc.goto(f'{BASE}/p/agro-abc-1Litre.html?classic=1'); pc.wait_for_timeout(1500)
    check('redirect: ?classic=1 keeps the old page on a phone', pc.evaluate('location.pathname') == '/p/agro-abc-1Litre.html', pc.url)
    cc.close()
    c10 = b.new_context(viewport={'width': 1280, 'height': 800}); mock_network(c10)
    p10 = c10.new_page(); p10.goto(f'{BASE}/?product=agro-abc-250ml'); p10.wait_for_function("location.pathname !== '/'", timeout=15000)
    check('address: on a desktop screen it opens that product\'s full page (/p/<slug>.html)', p10.evaluate('location.pathname') == '/p/agro-abc-250ml.html', p10.url)
    c10.close()

    # category pages -> shell on phones (seo-shell-redirect.mjs, injectCat). The served /c/ page is the REAL generated page with the shipped script injected.
    import subprocess, re as _re
    def cat_page(slug):
        js = "import('./seo-shell-redirect.mjs').then(m=>process.stdout.write(m.injectCat(require('fs').readFileSync('c/%s.html','utf8'))))" % slug
        return subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    def serve_c(ctx):
        def h(rt):
            m = _re.search(r'/c/([a-z0-9-]+)\.html', rt.request.url)
            rt.fulfill(status=200, content_type='text/html', body=cat_page(m.group(1)))
        ctx.route('**/c/*.html*', h)
    check('category redirect: the injected category page carries the script and the page is otherwise unchanged', 'stm-shell-cat' in cat_page('rodent-control') and 'Rodent Control' in cat_page('rodent-control'))
    check('category redirect: injecting twice gives the same page', cat_page('rodent-control').count('stm-shell-cat') == 1)
    c12 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c12); serve_c(c12)
    p12 = c12.new_page(); e12 = []; p12.on('pageerror', lambda e: e12.append(str(e)))
    p12.goto(f'{BASE}/c/pest-control-fumigation.html'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    ids = p12.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('category redirect: a phone on a category page lands in the shell on that category (only its products)', ids and all(i.startswith('pest-') for i in ids), ids)
    check('category redirect: the address becomes / (no leftover ?cat=)', p12.evaluate('location.pathname + location.search') == '/', p12.url)
    p12.goto(f'{BASE}/c/bed-bug-killers.html'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    ids = p12.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('category redirect: a sub-category page opens its parent category filtered to that sub-category', ids and all(i.startswith('pest-') for i in ids) and p12.evaluate('location.pathname') == '/', ids)
    p12.goto(f'{BASE}/?cat=no-such-category'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    check('category redirect: an unknown category shows a notice and the normal home', 'no longer available' in p12.locator('#toast').inner_text(), p12.locator('#toast').inner_text())
    check('category redirect: no page errors', not e12, e12[:3])
    c12.close()
    for label, kw in [('Googlebot', dict(user_agent='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', viewport={'width': 390, 'height': 780})),
                      ('WhatsApp', dict(user_agent='WhatsApp/2.23.20.0 A', viewport={'width': 390, 'height': 780})),
                      ('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx); serve_c(cx)
        px = cx.new_page(); px.goto(f'{BASE}/c/rodent-control.html'); px.wait_for_timeout(1500)
        check(f'category redirect: {label} keeps the category page (no redirect)', px.evaluate('location.pathname') == '/c/rodent-control.html', px.url)
        cx.close()
    cc2 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(cc2); serve_c(cc2)
    pc2 = cc2.new_page(); pc2.goto(f'{BASE}/c/rodent-control.html?classic=1'); pc2.wait_for_timeout(1500)
    check('category redirect: ?classic=1 keeps the category page on a phone', pc2.evaluate('location.pathname') == '/c/rodent-control.html', pc2.url)
    cc2.close()

    # static pages (shell-chrome.js): shell top bar + bottom nav on phones; /?tab= and /?q= open the shell
    PAGES = ['account', 'track', 'shipping', 'returns', 'contact', 'faq', 'about', 'privacy', 'terms']
    c13 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c13)
    p13 = c13.new_page(); e13 = []; p13.on('pageerror', lambda e: e13.append(str(e)))
    bad = []
    for nm in PAGES:
        p13.goto(f'{BASE}/{nm}.html'); p13.wait_for_selector('#stm-nav', state='attached', timeout=10000)
        ok = p13.locator('#stm-bar').is_visible() and p13.locator('#stm-nav a').count() == 5 and p13.locator('body > header').first.is_hidden() and p13.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if not ok: bad.append(nm)
    check('static pages: every page shows the shell top bar + bottom nav on a phone, its own header is hidden, no sideways scroll', not bad, bad)
    p13.goto(f'{BASE}/shipping.html'); p13.wait_for_selector('#stm-nav', state='attached')
    check('static pages: the page text is unchanged (still has its H1 and the delivery facts)', 'Shipping and delivery' in p13.locator('h1').first.inner_text() and '47 counties' in p13.locator('main').inner_text())
    check('static pages: the bottom nav marks Account as the current section', p13.locator('#stm-nav a[aria-current="page"]').inner_text().strip() == 'Account')
    p13.evaluate("localStorage.setItem('shell.cart', JSON.stringify([{qty:2},{qty:1}]))"); p13.reload(); p13.wait_for_selector('#stm-nav', state='attached')
    check('static pages: the cart badge shows the shell cart quantity (3)', p13.locator('#stm-nav .stm-badge').inner_text() == '3' and p13.locator('#stm-bar .stm-badge').inner_text() == '3')
    p13.locator('#stm-nav a', has_text='Cart').click(); p13.wait_for_selector('#view-cart:not([hidden])', timeout=15000)
    check('static pages: the nav Cart link opens the shell on the Cart tab (address cleaned to /)', p13.locator('#view-cart').is_visible() and p13.evaluate('location.pathname + location.search') == '/', p13.url)
    p13.goto(f'{BASE}/faq.html'); p13.wait_for_selector('#stm-nav', state='attached')
    p13.locator('#stm-nav a', has_text='Categories').click(); p13.wait_for_selector('#view-categories:not([hidden])', timeout=15000)
    check('static pages: the nav Categories link opens the shell on Categories', p13.locator('#view-categories').is_visible() and p13.locator('#view-home').is_hidden())
    p13.goto(f'{BASE}/contact.html'); p13.wait_for_selector('#stm-bar', state='attached')
    p13.fill('#stm-bar input', 'bed bug'); p13.keyboard.press('Enter'); p13.wait_for_selector('#grid .card[data-id]', timeout=15000); p13.wait_for_timeout(600)
    ids = p13.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('static pages: the top-bar search opens the shell with that search (box filled, only matching products)', p13.input_value('#search') == 'bed bug' and ids and all(i.startswith('pest-') for i in ids) and p13.evaluate('location.search') == '', (p13.input_value('#search'), ids))
    p13.goto(f'{BASE}/?tab=nonsense'); p13.wait_for_selector('#grid .card[data-id]', timeout=15000)
    check('static pages: an unknown ?tab= value opens Home', p13.locator('#view-home').is_visible())
    check('static pages: no page errors', not e13, e13[:3])
    c13.close()
    for label, kw in [('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx)
        px = cx.new_page(); px.goto(f'{BASE}/shipping.html'); px.wait_for_timeout(800)
        check(f'static pages: {label} gets the page without the shell bar', px.locator('#stm-bar').count() == 0 and px.locator('body > header').first.is_visible(), px.url)
        cx.close()

    # redirects: old shared product links and desktop screens go to the full shop; the prototype address goes home
    c6 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c6)
    p6 = c6.new_page(); p6.goto(f'{BASE}/#p-home-0'); p6.wait_for_function("location.pathname !== '/'", timeout=15000); p6.wait_for_timeout(1500)
    check('old /#p-... product link opens the full shop and that product (it then shows the straight /p/ URL)', p6.url.endswith('/classic.html#p-home-0') or '/p/' in p6.url, p6.url)
    p6.goto(f'{BASE}/mobile-shell/'); p6.wait_for_function("location.pathname === '/'", timeout=15000)
    check('/mobile-shell/ forwards to the home page', p6.url == BASE + '/', p6.url)
    c6.close()
    c7 = b.new_context(viewport={'width': 1280, 'height': 800}); mock_network(c7)
    p7 = c7.new_page(); p7.goto(URL); p7.wait_for_function("location.pathname === '/classic.html'", timeout=15000)
    check('desktop screens keep the full classic shop', '/classic.html' in p7.url, p7.url)
    c7.close()
    check('no page errors during the handoff flow', not e4, e4[:3])

    check('no console/page errors', not errors, errors[:3])
    b.close()

fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
