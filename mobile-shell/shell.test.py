# Headless-mobile test of the shell. Needs: pip install playwright && playwright install chromium
# Run: python3 mobile-shell/shell.test.py   (screenshots go to the system temp folder)
import re, sys, threading, http.server, socketserver, functools, os, tempfile, json, base64, time
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
    dict(id=31, name='Outdoor & Garden', slug='garden-outdoors', parent_id=None, sort_order=15, is_promo=False),
    dict(id=32, name='Garden Care', slug='garden-care', parent_id=31, sort_order=0, is_promo=False),
    dict(id=1, name='Home & Living', slug='home-living', parent_id=None, sort_order=16, is_promo=False),
    dict(id=71, name='Garden Tools', slug='garden-tools', parent_id=1, sort_order=0, is_promo=False),
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
ROWS += [row(f'garden-set-{l.replace(" ", "")}', 71, 'Garden Hose Connector Set', pr, int(pr * 1.15), featured=True, group='garden-set', label=l)
         for l, pr in [('1 Litre', 6450), ('250 ml', 1550), ('100 ml', 690), ('50 ml', 390)]]
ROWS += [row(f'outdoor-{i}', 32, f'Garden Hose Nozzle {i}', 300 + i * 250, 300 + i * 250 + 60 * (i % 3)) for i in range(1, 6)]
ROWS += [row('outdoor-broken', 32, 'Plant Pot Set', 450, 520, img=BROKEN)]
ROWS += [row(f'phone-{i}', 2, f'Phone Model {i}', 9000 + i * 4000, 9000 + i * 4000 + 1500) for i in range(1, 9)]
ROWS += [row('garden-1', 71, 'Watering Can', 1200, 1200), row('garden-2', 71, 'Garden Gloves', 800, 900)]
ROWS += [row('home-1', 24, 'Air Fryer 5L', 6500, 7800), row('home-2', 24, 'Kettle 1.8L', 1800, 2100), row('home-3', 24, 'Blender', 3200, 3900)]
ROWS += [row('home-soldout', 24, 'Gone Item', 100, 120, stock=0)]
NAMES_FIX = {'home-0': 'Heavy-Duty Hot Plate Pro'}   # product-names.json heading; every other product falls back to its database name
FAIL = [False]
# Products the Deals badge should count: in stock, lowest size has an old price above its price. 19 = hot plate, Garden Hose Connector Set (one folded product),
# 4 garden hose sprays (outdoor-3 has no old price), the powder, 8 phones, Garden Gloves, 3 kitchen items; the sold-out item and Watering Can do not count.
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
    if '/rest/v1/rpc/get_store_catalog' in url: return serve(route, [dict(id=r['id'], slug=r['slug'], name=r['name'], category_id=r['category_id'], price=r['price'], old_price=r['old_price'], stock=r['stock'], featured=r['featured'], images=r['images'], cover_image=(r['images'][0] if r['images'] else ''), unit=r['unit'], variant_group=r['variant_group'], variant_label=r['variant_label']) for r in ROWS])
    serve(route, ROWS if '/rest/v1/products' in url else CATS_FIX)
# The fixture slugs have no /p/ file; every /p/*.html address is answered with a REAL generated product page (the redirect script was removed 2026-11-03, so visitors stay on it).
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
    check('database name used when the heading file has no entry', 'Garden Hose Nozzle 1' in pg.locator('#grid').inner_text() or pg.locator('#grid .card[data-id^="outdoor-"]').count() >= 1)
    check('real product photo is rendered', pg.locator('#grid .card[data-id="home-0"] img[src="https://img.test/ok.png"]').count() == 1)
    pg.wait_for_timeout(200)
    check('broken photo falls back to the category emoji', pg.locator('#grid .card[data-id="outdoor-broken"] img').count() == 0 and '🛍️' in pg.locator('#grid .card[data-id="outdoor-broken"]').inner_text())
    check('pack sizes fold into ONE card with a From price', pg.locator('#grid .card[data-id="garden-set"]').count() == 1 and 'From KSh 390' in pg.locator('#grid .card[data-id="garden-set"]').inner_text() and '4 sizes' in pg.locator('#grid .card[data-id="garden-set"]').inner_text())
    check('sold-out product is hidden', pg.locator('#grid .card[data-id="home-soldout"]').count() == 0)
    check('chips come from the live categories (promo + empty ones left out)', pg.locator('#chips .chip').all_inner_texts() == ['For you', 'Phones & Accessories', 'Home & Kitchen', 'Outdoor & Garden', 'Home & Living'], pg.locator('#chips .chip').all_inner_texts())
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
    pg.locator('#grid .card[data-id="garden-set"] [data-add]').click()
    check('plus on a multi-size card opens the size sheet', pg.locator('#sheet-quickbuy.open').count() == 1 and pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1')
    check('sizes listed smallest price first', pg.locator('#qb-sizes .chip').all_inner_texts() == ['50 ml', '100 ml', '250 ml', '1 Litre'], pg.locator('#qb-sizes .chip').all_inner_texts())
    pg.locator('#qb-sizes [data-size="250 ml"]').click()
    check('each size shows its own price', pg.locator('#qb-price').inner_text() == 'KSh 1,550' and pg.locator('#qb-old').inner_text() == 'KSh 1,782', pg.locator('#qb-price').inner_text())
    pg.wait_for_function("document.querySelector('#qb-desc').innerText.includes('ABOUT Garden Hose Connector Set')", timeout=5000)
    check('details: description, unit and stock of the chosen size are shown', 'line one' in pg.locator('#qb-desc').inner_text() and pg.locator('#qb-meta').inner_text() == 'Unit: Each · In stock', pg.locator('#qb-meta').inner_text())
    check('details: link to the full product page of that size', pg.locator('#qb-page').get_attribute('href') == '/p/garden-set-250ml.html' and pg.locator('#qb-page').is_visible(), pg.locator('#qb-page').get_attribute('href'))
    check('details: extra photos listed and tapping one changes the main photo', pg.locator('#qb-photos [data-photo]').count() == 2 and (pg.locator('#qb-photos [data-photo]').nth(1).click() or True) and pg.locator('#qb-img img').count() == 1)
    pg.screenshot(path=f'{OUT}/shot-details.png')
    # the full product page opens INSIDE the shell (no navigation to /p/...)
    url_before = pg.url
    pg.locator('#qb-page').click()
    pg.wait_for_selector('#page-product.open', timeout=5000)
    pg.wait_for_function("document.querySelector('#pp-desc').innerText.includes('ABOUT Garden Hose Connector Set')", timeout=5000)
    check('product page opens inside the shell (same URL, shell still loaded)', pg.url == url_before and pg.locator('#bottom-nav').count() == 1, pg.url)
    check('product page shows name, price, sizes, description, unit and trust lines', 'Garden Hose Connector Set' in pg.locator('#pp-name').inner_text() and 'KSh 1,550' in pg.locator('#pp-price').inner_text() and pg.locator('#pp-sizes .chip').count() == 4 and 'line two' in pg.locator('#pp-desc').inner_text() and 'Unit: Each' in pg.locator('#pp-meta').inner_text() and '47 counties' in pg.locator('#page-product').inner_text())
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
    pg.locator('#cat-side [data-side="home-living"]').click()
    check('side list swaps right grid', 'Garden Tools' in pg.locator('#cat-main').inner_text())
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

    # reload with a sheet open does not reopen it; clear the search first so the fixture has a visible product to open
    pg.fill('#search', ''); pg.keyboard.press('Enter'); pg.wait_for_selector('#grid .card[data-id]')
    pg.locator('#grid .card[data-id]').first.locator('p').first.click()
    # Opening a product changes the address to its canonical /p/<slug>.html URL.
    # To test shell reload state (rather than the separate full product page), return
    # the address to the shell root while preserving the current history state.
    pg.evaluate("history.replaceState(history.state, '', '/')")
    pg.reload(); pg.wait_for_selector('#grid .card[data-id]', timeout=15000)
    check('reload while sheet open lands clean', pg.locator('#sheet-quickbuy.open').count() == 0)
    check('deals badge stays cleared after reload (nothing new since the visit to Deals)', pg.locator('#bottom-nav [data-badge="deals"]').is_hidden())

    # Supabase down: the grid offers a retry instead of hanging on skeletons, and recovers
    FAIL[0] = True
    p2 = ctx.new_page(); p2.goto(URL)
    p2.wait_for_selector('#grid-empty:not([hidden])', timeout=8000)
    check('network failure shows a retry link, no stuck skeletons', 'Could not load products' in p2.locator('#grid-empty').inner_text() and p2.locator('#grid-empty a[href="/"]').count() == 1 and p2.locator('#grid .card[aria-hidden="true"]').count() == 0)
    FAIL[0] = False
    p2.locator('[data-retry]').click(); p2.wait_for_selector('#grid .card[data-id]')
    check('retry loads the products', p2.locator('#grid .card[data-id]').count() >= 12 and p2.locator('#grid-empty').is_hidden())
    p2.close()

    # a cart saved by the old mock prototype (no rowId) is dropped, not shown with fake prices
    c3 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c3)
    p3 = c3.new_page()
    p3.add_init_script("localStorage.setItem('shell.cart', JSON.stringify([{key:'outdoor-0|50 ml',id:'outdoor-0',name:'Mock',size:'50 ml',qty:2,price:100,emoji:'x',bg:'#fff'}]))")
    p3.goto(URL); p3.wait_for_selector('#grid .card[data-id]')
    check('stale mock-era cart lines are dropped', p3.locator('#bottom-nav [data-badge="cart"]').is_hidden())
    c3.close()

    # a reload on a tab other than Home stays on that tab (owner bug 2026-10-31: refreshing the Categories tab went back to the home page)
    c12 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c12)
    p12 = c12.new_page(); e12 = []; p12.on('pageerror', lambda e: e12.append(str(e)))
    p12.goto(URL); p12.wait_for_selector('#grid .card[data-id]')
    p12.locator('#bottom-nav [data-tab="categories"]').click()
    # Simulate browsers/restores that lose history.state on refresh; sessionStorage must still restore the tab.
    p12.evaluate("history.replaceState(null, '', location.href)")
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
    check('home page keeps the SEO head (brand-first title, canonical, index robots, JSON-LD)', re.search(r'<title>Stermont Arcade \|[^<]*</title>', html) and 'rel="canonical" href="https://stermontarcade.co.ke/"' in html and 'index, follow' in html and html.count('application/ld+json') >= 2 and 'noindex' not in html)
    check('home page carries the seo-links markers the build bot fills (crawlable category + product links)', html.count('<!-- seo-links:start -->') == 1 and html.count('<!-- seo-links:end -->') == 1 and '/c/' in html and '/p/' in html)
    cls = open(os.path.join(ROOT, 'classic.html'), encoding='utf-8').read()
    chk = open(os.path.join(ROOT, 'checkout.html'), encoding='utf-8').read()
    check('checkout.html (the checkout surface) is noindex so only / is indexed', 'content="noindex, follow"' in chk and 'index, follow, max-image' not in chk)
    check('classic.html is only a tiny forwarder: noindex, no shop code, no script files', len(cls) < 3000 and 'content="noindex, follow"' in cls and '<script src' not in cls, len(cls))

    def chain(path):   # every address the main frame passes through, in order
        cx = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(cx)
        pgx = cx.new_page(); seen = []
        pgx.on('framenavigated', lambda f: seen.append(f.url.replace(BASE, '')) if f == pgx.main_frame else None)
        pgx.goto(BASE + path); pgx.wait_for_timeout(1500); cx.close()
        return list(dict.fromkeys(seen))
    ch = chain('/classic.html')
    check('old /classic.html bookmark forwards straight to the shell', ch[-1] == '/' and not any('checkout' in u for u in ch), ch)
    ch = chain('/classic.html#p-abasi-5-ec')
    check('old classic #p-<id> link opens that product in the shell', '/?product=abasi-5-ec' in ch, ch)
    ch = chain('/classic.html?item=abasi-5-ec')
    check('old classic ?item=<id> link opens that product in the shell', '/?product=abasi-5-ec' in ch, ch)
    ch = chain('/?item=abasi-5-ec')
    check('old home-page share link /?item=<id> opens that product in the shell', '/?product=abasi-5-ec' in ch, ch)
    ch = chain('/classic.html?cart=home-0:2')
    check('old classic ?cart= link keeps the cart lines and goes to the shell', any(u.startswith('/?cart=') for u in ch), ch)
    ch = chain('/classic.html?checkout=1')
    check('a stale shell that still opens classic.html?checkout=1 reaches the checkout page', ch[-1].startswith('/checkout.html'), ch)
    ch = chain('/checkout.html')
    check('opening checkout.html directly (no cart handoff) goes to the shell, never shows the old home', ch[-1] == '/', ch)

    c4 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c4)
    p4 = c4.new_page(); e4 = []; p4.on('pageerror', lambda e: e4.append(str(e)))
    p4.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('shell.cart', JSON.stringify([{key:'home-0|Standard',id:'home-0',rowId:'home-0',name:'Heavy-Duty Hot Plate Pro',size:'Standard',qty:1,price:2500,emoji:'x',bg:'#fff'},{key:'home-1|Standard',id:'home-1',rowId:'home-1',name:'Air Fryer 5L',size:'Standard',qty:2,price:6500,emoji:'x',bg:'#fff'}])); }")
    p4.goto(URL); p4.wait_for_selector('#grid .card[data-id]')
    p4.locator('#bottom-nav [data-tab="cart"]').click()
    p4.locator('#checkout').click()
    p4.wait_for_selector('#checkout-frame', timeout=8000)
    check('Checkout opens inside the shell (no page redirect): address stays on the shell', p4.url == BASE + '/' and '/classic.html' not in p4.url, p4.url)
    check('the Checkout layer loads /checkout.html and never /classic.html', any('/checkout.html' in f.url for f in p4.frames) and not any('/classic.html' in f.url for f in p4.frames), [f.url for f in p4.frames])
    co = p4.frame_locator('#checkout-frame')
    co.locator('#dr.on').wait_for(timeout=15000)
    cart_txt = co.locator('#dr').inner_text()
    check('the shop cart opens by itself with the shell items and prices', 'Hot Plate' in cart_txt and 'Air Fryer' in cart_txt and '2,500' in cart_txt and '6,500' in cart_txt, cart_txt[:200])
    check('quantities carried over (1 hot plate + 2 air fryers, KSh 15,500)', '15,500' in cart_txt, cart_txt[:300])
    check('handoff is consumed (no double add on reload)', p4.evaluate("localStorage.getItem('stm_handoff')") is None and 'checkout=1' not in p4.url)
    check('the shell cart is kept until the order is finished (a cancelled checkout loses nothing)', len(json.loads(p4.evaluate("localStorage.getItem('shell.cart')") or '[]')) == 2)
    check('checkout mode: the old home page is not shown behind the checkout', p4.frames[-1].evaluate("document.documentElement.classList.contains('stm-co') && !document.documentElement.classList.contains('stm-co-wait') && [...document.querySelectorAll('.pcard, #featured, header, .hd-r')].every(e => e.getBoundingClientRect().width === 0 || getComputedStyle(e).visibility === 'hidden' || e.offsetParent === null)"))
    co.locator('#dr-x').click(); p4.wait_for_selector('#checkout-frame', state='detached', timeout=8000)
    check('closing the checkout returns to the shell without a page change', p4.url == BASE + '/', p4.url)
    p4.wait_for_selector('#view-cart', state='visible')
    check('cancelled checkout: the shell cart still has its items', json.loads(p4.evaluate("localStorage.getItem('shell.cart')") or '[]') != [])
    c4.close()

    # a finished order (empty shop cart) clears the shell cart when the checkout is closed
    c4b = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c4b)
    p4b = c4b.new_page()
    p4b.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('shell.cart', JSON.stringify([{key:'home-2|Standard',id:'home-2',rowId:'home-2',name:'Kettle 1.8L',size:'Standard',qty:1,price:1800}])); localStorage.setItem('stm_handoff', JSON.stringify([{rowId:'home-2',qty:1,price:1800,name:'Kettle 1.8L',size:'Standard'}])); }")
    p4b.goto(URL); p4b.wait_for_selector('#grid .card[data-id]')
    p4b.locator('#bottom-nav [data-tab="cart"]').click(); p4b.locator('#checkout').click()
    co4b = p4b.frame_locator('#checkout-frame'); co4b.locator('#dr.on').wait_for(timeout=15000)
    p4b.frames[-1].evaluate("localStorage.setItem('stm_cart', '{}')")
    co4b.locator('#dr-x').click(); p4b.wait_for_selector('#checkout-frame', state='detached', timeout=8000)
    check('finished order: the shell cart is cleared', json.loads(p4b.evaluate("localStorage.getItem('shell.cart')") or '[]') == [])
    c4b.close()

    # a price that changed since the customer saw it is never charged: the line is skipped and the customer is told
    c5 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c5)
    p5 = c5.new_page()
    p5.add_init_script("if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('stm_handoff', JSON.stringify([{rowId:'home-0',qty:1,price:1999,name:'Hot Plate',size:'Standard'},{rowId:'home-2',qty:1,price:1800,name:'Kettle 1.8L',size:'Standard'}])); }")
    p5.goto(f'{BASE}/checkout.html?checkout=1'); p5.wait_for_selector('[role=alert]', timeout=15000)
    check('changed price: customer is told which item to add again', 'Hot Plate' in p5.locator('[role=alert]').inner_text())
    p5.wait_for_selector('#dr.on', timeout=5000); t5 = p5.locator('#dr').inner_text()
    check('changed price: only the unchanged item reached the cart', 'Kettle' in t5 and '1,800' in t5 and '1,999' not in t5 and '2,500' not in t5, t5[:200])
    c5.close()

    # product page: Add to cart and Buy now work from the full page
    c8 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c8)
    p8 = c8.new_page(); p8.goto(URL); p8.wait_for_selector('#grid .card[data-id]')
    p8.locator('#grid .card[data-id="garden-set"] [data-add]').click(); p8.wait_for_selector('#sheet-quickbuy.open')
    p8.locator('#qb-page').click(); p8.wait_for_selector('#page-product.open')
    p8.locator('#pp-plus').click(); p8.locator('#pp-add').click()
    check('product page: Add to cart adds the chosen size and quantity', p8.locator('#bottom-nav [data-badge="cart"]').inner_text() == '2', p8.locator('#bottom-nav [data-badge="cart"]').inner_text())
    p8.locator('#pp-related [data-pp-open]').first.click()
    check('product page: a similar product replaces the one shown', 'Garden Hose Connector Set' not in p8.locator('#pp-name').inner_text())
    p8.locator('#pp-buy').click(); p8.wait_for_selector('#view-cart:not([hidden])', timeout=5000)
    check('product page: Buy now lands on the Cart tab with both items', p8.locator('#page-product.open').count() == 0 and p8.locator('#view-cart').is_visible() and p8.locator('#cart-list li').count() == 2, p8.locator('#cart-list li').count())
    # change an existing cart line to another pack without removing/re-adding it
    p8.locator('#bottom-nav [data-tab="cart"]').click(); p8.wait_for_selector('#view-cart:not([hidden])')
    p8.locator('#cart-list [data-edit]').filter(has=p8.locator('#cart-list [data-edit]')).first.click()
    p8.wait_for_selector('#page-product.open')
    p8.locator('#pp-sizes [data-pp-size="250 ml"]').click()
    check('cart pack editor shows Update cart item and hides Buy now', p8.locator('#pp-add').inner_text() == 'Update cart item' and p8.locator('#pp-buy').is_hidden())
    p8.locator('#pp-add').click(); p8.wait_for_selector('#view-cart:not([hidden])')
    changed = p8.locator('#cart-list').inner_text()
    check('cart pack change updates size and price while preserving quantity and other items', '250 ml' in changed and '1,550' in changed and p8.locator('#cart-list li').count() == 2 and p8.locator('#cart-title-count').inner_text() == '(3)', changed[:250])
    c8.close()

    # product addresses: an open product has its own URL (/?product=<slug of the size>), the base entry stays "/", and the address reopens the product
    c9 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c9)
    p9 = c9.new_page(); e9 = []
    p9.on('pageerror', lambda e: e9.append(str(e)))
    p9.goto(URL); p9.wait_for_selector('#grid .card[data-id]')
    base_title = p9.title()
    check('address: home is the bare "/" address', p9.evaluate('location.pathname + location.search') == '/')
    p9.locator('#grid .card[data-id="garden-set"] p').first.click(); p9.wait_for_selector('#sheet-quickbuy.open')
    check('address: opening a product puts its own page address (/p/<slug>.html + size) in the address bar', p9.evaluate('location.pathname + location.hash') == '/p/garden-set-1Litre.html#garden-set-50ml', p9.url)
    check('address: the address bar has no query string (no ?shell=1)', p9.evaluate('location.search') == '', p9.url)
    check('address: tab title shows the product', 'Garden Hose Connector Set' in p9.title() and p9.title().endswith('| Stermont Arcade'), p9.title())
    p9.locator('#qb-sizes [data-size="250 ml"]').click()
    check('address: choosing another size updates the address (no extra history entry)', p9.evaluate('location.pathname + location.hash') == '/p/garden-set-1Litre.html#garden-set-250ml', p9.url)
    p9.locator('#qb-page').click(); p9.wait_for_selector('#page-product.open')
    check('address: the full product page keeps the same address', p9.evaluate('location.pathname + location.hash') == '/p/garden-set-1Litre.html#garden-set-250ml', p9.url)
    p9.go_back(); p9.wait_for_function("!document.querySelector('#page-product.open')")
    check('address: Back from the page returns to the sheet, address unchanged', p9.locator('#sheet-quickbuy.open').count() == 1 and p9.evaluate('location.hash') == '#garden-set-250ml')
    p9.go_back(); p9.wait_for_function("!document.querySelector('#sheet-quickbuy.open')")
    check('address: closing the product restores "/" and the page title', p9.evaluate('location.pathname + location.search') == '/' and p9.title() == base_title, p9.url + ' | ' + p9.title())
    p9.goto(f'{BASE}/?product=garden-set-250ml'); p9.wait_for_selector('#page-product.open', timeout=10000)
    check('address: opening the address shows that product page with that size', 'Garden Hose Connector Set' in p9.locator('#pp-name').inner_text() and p9.locator('#pp-price').inner_text() == 'KSh 1,550', p9.locator('#pp-price').inner_text())
    check('address: the address stays after load and the tab title shows the product', p9.evaluate('location.pathname + location.hash') == '/p/garden-set-1Litre.html#garden-set-250ml' and 'Garden Hose Connector Set' in p9.title())
    p9.go_back(); p9.wait_for_function("!document.querySelector('#page-product.open')")
    check('address: Back from an opened address lands on the shell home ("/")', p9.evaluate('location.pathname + location.search') == '/' and p9.locator('#view-home').is_visible(), p9.url)
    p9.reload(); p9.wait_for_selector('#grid .card[data-id]')
    p9.goto(f'{BASE}/?product=home-1'); p9.wait_for_selector('#page-product.open', timeout=10000)
    check('address: a single-size product opens from its address too', 'Air Fryer' in p9.locator('#pp-name').inner_text())
    p9.evaluate("window.__shared = null; navigator.share = d => { window.__shared = d; return Promise.resolve(); }")
    p9.locator('#pp-share').click(); p9.wait_for_function('window.__shared')
    sh = p9.evaluate('window.__shared')
    check('share: shares the product\'s own clean /p/ page link (no ?shell=1), not the shell address', sh['url'] == f'{BASE}/p/home-1.html' and 'shell=1' not in sh['url'] and 'Air Fryer' in sh['title'], sh)
    p9.evaluate("navigator.share = undefined; window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied = t; return Promise.resolve(); } }, configurable: true })")
    p9.locator('#pp-share').click(); p9.wait_for_function('window.__copied')
    check('share: without the share sheet the clean link is copied and a notice shows', p9.evaluate('window.__copied') == f'{BASE}/p/home-1.html' and 'Link copied' in p9.locator('#toast').inner_text(), p9.locator('#toast').inner_text())
    check('share: the address bar shows the same product page address', p9.evaluate('location.pathname') == '/p/home-1.html' and p9.evaluate('location.search') == '')
    p9.goto(f'{BASE}/?product=does-not-exist'); p9.wait_for_selector('#grid .card[data-id]'); p9.wait_for_timeout(600)
    check('address: an unknown product shows a notice and the normal home', p9.locator('#page-product.open').count() == 0 and 'no longer available' in p9.locator('#toast').inner_text(), p9.locator('#toast').inner_text())
    check('address: no page errors', not e9, e9[:3])
    c9.close()

    # /p/<slug>.html no longer redirects anyone (2026-11-03, owner request: Google may read "crawlers get the page, visitors get the shell" as a sneaky redirect).
    # seo-shell-redirect.mjs now only STRIPS the old script. The served page is the REAL generated product page.
    import subprocess, re as _re
    check('redirect removed: the generated product pages no longer carry the phone redirect script', 'stm-shell' not in REAL)
    OLD_SCRIPT = '<!--stm-shell--><script>(function(){location.replace("/?product=x")})();</script>'
    OLD_CAT_SCRIPT = '<!--stm-shell-cat--><script>(function(){location.replace("/?cat=x")})();</script>'
    def run_node(fn, html):
        js = "import('./seo-shell-redirect.mjs').then(m=>process.stdout.write(m.%s(process.argv[1])))" % fn
        return subprocess.run(['node', '-e', js, html], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    old_page = '<!doctype html><html><head><meta charset="utf-8">' + OLD_SCRIPT + '<title>t</title></head><body>x</body></html>'
    new_page = run_node('inject', old_page)
    check('redirect removed: inject() strips the old product script and keeps the rest of the page', 'stm-shell' not in new_page and '<title>t</title>' in new_page and '<body>x</body>' in new_page, new_page)
    check('redirect removed: inject() twice gives the same page', run_node('inject', new_page) == new_page)
    stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/x.html">' + OLD_SCRIPT + '</head></html>'
    check('redirect removed: redirect stubs (meta refresh) are left alone', run_node('inject', stub) == stub)
    old_cat = '<!doctype html><html><head><meta charset="utf-8">' + OLD_CAT_SCRIPT + '<title>c</title></head><body>y</body></html>'
    new_cat = run_node('injectCat', old_cat)
    check('redirect removed: injectCat() strips the old category script and keeps the rest', 'stm-shell-cat' not in new_cat and '<title>c</title>' in new_cat and '<body>y</body>' in new_cat, new_cat)
    check('redirect removed: injectCat() twice gives the same page', run_node('injectCat', new_cat) == new_cat)
    def serve_p(ctx): pass   # mock_network already serves the real generated product page for every /p/*.html address
    c11 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c11); serve_p(c11)
    p11 = c11.new_page(); e11 = []; p11.on('pageerror', lambda e: e11.append(str(e)))
    p11.goto(f'{BASE}/p/garden-set-1Litre.html#garden-set-250ml'); p11.wait_for_timeout(1500)
    check('redirect removed: a phone opening a product page link stays on that page (no jump into the shell)', p11.evaluate('location.pathname') == '/p/garden-set-1Litre.html' and p11.locator('#page-product').count() == 0, p11.url)
    p11.goto(f'{BASE}/p/garden-set-1Litre.html'); p11.wait_for_timeout(1500)
    check('redirect removed: a phone opening a product page without a size stays on that page too', p11.evaluate('location.pathname') == '/p/garden-set-1Litre.html' and p11.locator('#bottom-nav').count() == 0, p11.url)
    check('redirect removed: no page errors', not e11, e11[:3])
    c11.close()
    for label, kw in [('Googlebot', dict(user_agent='Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', viewport={'width': 390, 'height': 780})),
                      ('WhatsApp', dict(user_agent='WhatsApp/2.23.20.0 A', viewport={'width': 390, 'height': 780})),
                      ('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx); serve_p(cx)
        px = cx.new_page(); px.goto(f'{BASE}/p/garden-set-1Litre.html'); px.wait_for_timeout(1500)
        check(f'redirect removed: {label} keeps the product page (no redirect)', px.evaluate('location.pathname') == '/p/garden-set-1Litre.html' and px.locator('#page-product').count() == 0, px.url)
        cx.close()
    cc = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(cc); serve_p(cc)
    pc = cc.new_page(); pc.goto(f'{BASE}/p/garden-set-1Litre.html?classic=1'); pc.wait_for_timeout(1500)
    check('redirect removed: ?classic=1 keeps the old page on a phone', pc.evaluate('location.pathname') == '/p/garden-set-1Litre.html', pc.url)
    cc.close()
    c10 = b.new_context(viewport={'width': 1280, 'height': 800}); mock_network(c10)
    p10 = c10.new_page(); p10.goto(f'{BASE}/?product=garden-set-250ml'); p10.wait_for_function("location.pathname !== '/'", timeout=15000)
    check('address: on a desktop screen it opens that product\'s full page (/p/<slug>.html)', p10.evaluate('location.pathname + location.hash') == '/p/garden-set-1Litre.html#garden-set-250ml', p10.url)
    c10.close()

    # category pages (/c/<slug>.html) no longer redirect either. The shell still understands /?cat=<slug> (links, reloads), so that part stays tested.
    def cat_page(slug):
        return open(os.path.join(ROOT, 'c', slug + '.html'), encoding='utf-8').read()
    def serve_c(ctx):
        def h(rt):
            m = _re.search(r'/c/([a-z0-9-]+)\.html', rt.request.url)
            rt.fulfill(status=200, content_type='text/html', body=cat_page(m.group(1)))
        ctx.route('**/c/*.html*', h)
    check('category redirect removed: the generated category pages carry no redirect script', 'stm-shell-cat' not in cat_page('garden-outdoors') and 'Garden' in cat_page('garden-outdoors'))
    c12 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c12); serve_c(c12)
    p12 = c12.new_page(); e12 = []; p12.on('pageerror', lambda e: e12.append(str(e)))
    p12.goto(f'{BASE}/c/garden-outdoors.html'); p12.wait_for_timeout(1500)
    check('category redirect removed: a phone on a category page stays on that page', p12.evaluate('location.pathname') == '/c/garden-outdoors.html' and p12.locator('#grid .card[data-id]').count() == 0, p12.url)
    p12.goto(f'{BASE}/?cat=garden-outdoors'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    ids = p12.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('shell address /?cat=<slug> still opens that category (only its products)', ids and all(i.startswith('outdoor-') for i in ids), ids)
    check('shell address /?cat=<slug>: the address becomes / (no leftover ?cat=)', p12.evaluate('location.pathname + location.search') == '/', p12.url)
    p12.goto(f'{BASE}/?cat=kitchen-dining'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    ids = p12.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('shell address /?cat=<sub-category> opens its parent category filtered to that sub-category', ids and all(i.startswith('home-') for i in ids) and p12.evaluate('location.pathname') == '/', ids)
    p12.goto(f'{BASE}/?cat=no-such-category'); p12.wait_for_selector('#grid .card[data-id]', timeout=15000); p12.wait_for_timeout(600)
    check('shell address /?cat=<unknown> shows a notice and the normal home', 'no longer available' in p12.locator('#toast').inner_text(), p12.locator('#toast').inner_text())
    check('category pages: no page errors', not e12, e12[:3])
    c12.close()
    for label, kw in [('Googlebot', dict(user_agent='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', viewport={'width': 390, 'height': 780})),
                      ('WhatsApp', dict(user_agent='WhatsApp/2.23.20.0 A', viewport={'width': 390, 'height': 780})),
                      ('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx); serve_c(cx)
        px = cx.new_page(); px.goto(f'{BASE}/c/garden-outdoors.html'); px.wait_for_timeout(1500)
        check(f'category redirect removed: {label} keeps the category page', px.evaluate('location.pathname') == '/c/garden-outdoors.html', px.url)
        cx.close()
    cc2 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(cc2); serve_c(cc2)
    pc2 = cc2.new_page(); pc2.goto(f'{BASE}/c/garden-outdoors.html?classic=1'); pc2.wait_for_timeout(1500)
    check('category redirect removed: ?classic=1 keeps the category page on a phone', pc2.evaluate('location.pathname') == '/c/garden-outdoors.html', pc2.url)
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
    p13.fill('#stm-bar input', 'nozzle'); p13.keyboard.press('Enter'); p13.wait_for_selector('#grid .card[data-id]', timeout=15000); p13.wait_for_timeout(600)
    ids = p13.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('static pages: the top-bar search opens the shell with that search (box filled, only matching products)', p13.input_value('#search') == 'nozzle' and ids and all(i.startswith('outdoor-') for i in ids) and p13.evaluate('location.search') == '', (p13.input_value('#search'), ids))
    p13.evaluate("sessionStorage.removeItem('shell.activeTab')"); p13.goto(f'{BASE}/?tab=nonsense'); p13.wait_for_selector('#grid .card[data-id]', timeout=15000)
    check('static pages: an unknown ?tab= value opens Home', p13.locator('#view-home').is_visible())
    check('static pages: no page errors', not e13, e13[:3])
    c13.close()
    for label, kw in [('a desktop screen', dict(viewport={'width': 1280, 'height': 800}))]:
        cx = b.new_context(**kw); mock_network(cx)
        px = cx.new_page(); px.goto(f'{BASE}/shipping.html'); px.wait_for_timeout(800)
        check(f'static pages: {label} shows shell bar and bottom nav', px.locator('#stm-bar').is_visible() and px.locator('#stm-nav a').count() == 5, px.url)
        cx.close()

    # redirects: old shared product links and desktop screens go to the full shop; the prototype address goes home
    c6 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c6)
    p6 = c6.new_page(); p6.goto(f'{BASE}/#p-home-0'); p6.wait_for_selector('#page-product.open', timeout=15000); p6.wait_for_timeout(500)
    check('legacy /#p-... link opens the product in the mobile shell at its canonical address', p6.evaluate('location.pathname') == '/p/home-0.html' and p6.locator('#bottom-nav').is_visible() and 'Hot Plate' in p6.locator('#pp-name').inner_text(), p6.url)
    p6.goto(f'{BASE}/mobile-shell/'); p6.wait_for_function("location.pathname === '/'", timeout=15000)
    check('/mobile-shell/ forwards to the home page', p6.url == BASE + '/', p6.url)
    c6.close()
    c7 = b.new_context(viewport={'width': 1280, 'height': 800}); mock_network(c7)
    p7 = c7.new_page(); p7.goto(URL); p7.wait_for_selector('#grid .card[data-id]', timeout=15000)
    check('desktop homepage stays in shell', p7.evaluate('location.pathname') == '/' and p7.locator('#bottom-nav').is_visible(), p7.url)
    c7.close()
    check('no page errors during the handoff flow', not e4, e4[:3])

    # shared cart link: /?cart=<id>:<qty>,... opens the Cart tab with those lines (the cart itself lives in each phone's storage)
    c13 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c13)
    p13 = c13.new_page(); e13 = []; p13.on('pageerror', lambda e: e13.append(str(e)))
    p13.goto(f'{BASE}/?cart=home-0:2,outdoor-1:1,gone-item:1'); p13.wait_for_selector('#cart-list li', timeout=15000); p13.wait_for_timeout(500)
    check('shared cart: opens straight on the Cart tab, not Home', p13.locator('#view-cart').is_visible() and not p13.locator('#view-home').is_visible())
    check('shared cart: lines and quantities arrive (unknown id skipped)', p13.locator('#cart-list li').count() == 2 and p13.locator('#cart-title-count').inner_text() == '(3)', p13.locator('#cart-title-count').inner_text())
    check('shared cart: total uses live prices', p13.locator('#cart-total').inner_text() == 'KSh 5,550', p13.locator('#cart-total').inner_text())
    check('shared cart: address is cleaned to /', p13.evaluate('location.pathname + location.search') == '/', p13.url)
    check('shared cart: Share cart link button is shown with items', p13.locator('#share-cart').is_visible())
    p13.goto(f'{BASE}/?cart=home-0:2'); p13.wait_for_selector('#cart-list li', timeout=15000); p13.wait_for_timeout(500)
    check('shared cart: opening a link again does not double quantities', p13.locator('#cart-title-count').inner_text() == '(3)', p13.locator('#cart-title-count').inner_text())
    p13.evaluate("window.__shared = null; navigator.share = u => { window.__shared = u; return Promise.resolve(); }")
    p13.locator('#share-cart').click(); p13.wait_for_timeout(200)
    shared = p13.evaluate('window.__shared') or {}
    check('shared cart: Share cart link builds an address carrying the lines', shared.get('url') == 'https://stermontarcade.co.ke/?cart=home-0:2,outdoor-1:1', shared)
    check('shared cart: no page errors', not e13, e13[:3])
    c13.close()
    c14 = b.new_context(viewport={'width': 1280, 'height': 800}); mock_network(c14)
    p14 = c14.new_page(); e14 = []; p14.on('pageerror', lambda e: e14.append(str(e)))
    p14.goto(f'{BASE}/?cart=home-0:2'); p14.wait_for_selector('#cart-list li', timeout=15000)
    check('shared cart: desktop opens shell cart tab with items', p14.locator('#view-cart').is_visible() and p14.locator('#cart-list li').count() == 1, p14.url)
    p14.evaluate("window.__shared = null; navigator.share = u => { window.__shared = u; return Promise.resolve(); }")
    p14.get_by_text('Share cart link').click(); p14.wait_for_timeout(200)
    sh14 = p14.evaluate('window.__shared') or {}
    check('shared cart: desktop cart drawer has a Share cart link button that builds the address', sh14.get('url') == 'https://stermontarcade.co.ke/?cart=home-0:2', sh14)
    check('shared cart: desktop no page errors', not e14, e14[:3])
    c14.close()

    # a reload keeps the chosen category (it used to fall back to Home / "For you")
    c15 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c15)
    p15 = c15.new_page(); e15 = []; p15.on('pageerror', lambda e: e15.append(str(e)))
    p15.goto(URL); p15.wait_for_selector('#grid .card[data-id]')
    p15.locator('#chips [data-chip="phones-accessories"]').click(); p15.wait_for_timeout(600)
    p15.reload(); p15.wait_for_selector('#grid .card[data-id]'); p15.wait_for_timeout(600)
    ids = p15.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('reload keeps the chosen category (chip, title and products)', p15.locator('#chips [data-chip="phones-accessories"]').get_attribute('aria-selected') == 'true' and p15.locator('#grid-title').inner_text() == 'Phones & Accessories' and ids and all(i.startswith('phone-') for i in ids), (ids[:4], p15.locator('#grid-title').inner_text()))
    p15.goto(f'{BASE}/?cat=garden-tools'); p15.wait_for_selector('#grid .card[data-id]'); p15.wait_for_timeout(600)
    p15.reload(); p15.wait_for_selector('#grid .card[data-id]'); p15.wait_for_timeout(600)
    ids = p15.locator('#grid .card[data-id]').evaluate_all('els => els.map(e => e.dataset.id)')
    check('reload keeps a sub-category opened from a /?cat= address', p15.locator('#grid-title').inner_text() == 'Garden Tools' and ids and all(i.startswith('garden-') for i in ids), (ids[:4], p15.locator('#grid-title').inner_text()))
    p15.locator('#chips [data-chip="all"]').click(); p15.wait_for_timeout(400)
    p15.reload(); p15.wait_for_selector('#grid .card[data-id]'); p15.wait_for_timeout(400)
    check('reload after going back to For you stays on For you', p15.locator('#grid-title').inner_text() == 'Recommended for you')
    p15.evaluate("sessionStorage.setItem('shell.activeCat', JSON.stringify({ chip: 'no-such-category', sub: '' }))")
    p15.reload(); p15.wait_for_selector('#grid .card[data-id]'); p15.wait_for_timeout(600)
    check('a saved category that no longer exists falls back to For you', p15.locator('#grid-title').inner_text() == 'Recommended for you' and p15.locator('#grid .card[data-id]').count() > 3)
    check('reload category: no page errors', not e15, e15[:3])
    c15.close()
    c16 = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mock_network(c16)
    p16 = c16.new_page(); p16.goto(URL); p16.wait_for_selector('#grid .card[data-id]')
    check('a fresh visit still starts on For you', p16.locator('#grid-title').inner_text() == 'Recommended for you')
    c16.close()

    co = open(os.path.join(ROOT, 'checkout-deferred.js'), encoding='utf-8').read()
    check('card box is switched off until Paystack is live (CFG.card false, rCard guarded)', 'card: false,' in co and 'function rCard(b, T) {\n        if (CFG.card !== true) return;' in co)
    check('no console/page errors', not errors, errors[:3])
    b.close()

fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
