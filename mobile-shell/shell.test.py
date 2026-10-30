# Headless-mobile test of the shell. Needs: pip install playwright && playwright install chromium
# Run: python3 mobile-shell/shell.test.py   (screenshots go to the system temp folder)
import sys, threading, http.server, socketserver, functools, os, tempfile, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = tempfile.gettempdir()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{port}/index.html'

# ---- Supabase is replaced by fixture data (the real project is not called by the test) ----
GOOD_IMG = f'http://127.0.0.1:{port}/icons/ok.png'        # any URL that loads; the grid only needs an <img> to exist
BAD_IMG = f'http://127.0.0.1:{port}/missing-photo.jpg'     # 404 -> the card must fall back to its emoji
def cat(i, name, slug, parent=None, sort=0, promo=False):
    return {'id': i, 'name': name, 'slug': slug, 'parent_id': parent, 'sort_order': sort, 'is_promo': promo}
CATS_FIX = [cat(1, 'Agrovet', 'agrovet', sort=1), cat(101, 'Fungicides', 'fungicides', parent=1), cat(75, 'Phones & Accessories', 'phones-accessories', sort=2),
            cat(79, 'Home & Kitchen', 'home-kitchen', sort=3), cat(83, 'Kili Featured', 'kili-featured', sort=4, promo=True), cat(90, 'Empty Category', 'empty', sort=5)]
def row(i, name, c, price, old=None, stock=10, images=None, group=None, label=None):
    return {'id': i, 'name': name, 'category_id': c, 'price': price, 'old_price': old, 'stock': stock, 'images': images if images is not None else [GOOD_IMG],
            'featured': False, 'variant_group': group, 'variant_label': label, 'unit': None, 'created_at': '2026-10-01T00:00:00Z'}
ROWS_FIX = [row('hm-1', 'Hot Plate', 79, 2400), row('ag-50', 'Chariot 500SC', 101, 300, old=400, group='chariot', label='50 ml'), row('ag-100', 'Chariot 500SC', 101, 550, group='chariot', label='100 ml'),
            row('ag-1l', 'Chariot 500SC', 101, 2400, stock=0, group='chariot', label='1 L'), row('hm-2', 'Iron Box', 79, 1800, images=[BAD_IMG]), row('hm-3', 'Kettle', 79, 1500), row('hm-4', 'Blender', 79, 3200),
            row('hm-5', 'Air Fryer 5L', 79, 9500, old=12000), row('hm-6', 'Fan', 79, 4100), row('hm-7', 'Rice Cooker', 79, 3900), row('hm-8', 'Toaster', 79, 8000, stock=0),
            row('ph-1', 'Phone Case', 75, 800), row('ph-2', 'Earbuds', 75, 2500, old=3000), row('ph-3', 'Power Bank', 75, 2900), row('ph-4', 'Charger 33W', 75, 1500),
            row('ph-5', 'Tablet 10in', 75, 18000), row('ph-6', 'Smartphone 4GB', 75, 30000),
            row('ag-2', 'Weed Killer', 1, 1200),
            row('pr-1', 'Featured Deal Lamp', 83, 700, old=1000)]
NAMES_FIX = {'hm-5': 'Original Air Fryer 5L Pro'}
DEALS_EXPECTED = 4   # hm-5, ph-2, pr-1 and the Chariot group (its cheapest size has an old price)
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,OPTIONS'}
seen_requests, held, HOLD = [], [], {'on': True, 'fail': False}
def json_route(data):
    def h(route):
        req = route.request
        if req.method == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
        seen_requests.append((req.url, req.headers))
        if HOLD['fail'] and '/products' in req.url: return route.fulfill(status=500, headers=CORS, body='{}')
        if HOLD['on'] and '/products' in req.url: held.append(route); return        # keep the answer back so the skeletons can be checked
        route.fulfill(status=200, headers={**CORS, 'content-type': 'application/json'}, body=json.dumps(data))
    return h
def wire(page):
    page.route('**/rest/v1/categories*', json_route(CATS_FIX))
    page.route('**/rest/v1/products*', json_route(ROWS_FIX))
    page.route('**/product-names.json', lambda r: r.fulfill(status=200, headers={'content-type': 'application/json'}, body=json.dumps(NAMES_FIX)))
    page.route('**/icons/ok.png', lambda r: r.fulfill(status=200, headers={'content-type': 'image/png'}, body=open(os.path.join(ROOT, '..', 'icon-192.png'), 'rb').read()))

results = []
def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{extra}]' if extra and not cond else ''))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    wire(pg)
    pg.goto(URL)

    # skeletons then products
    pg.wait_for_selector('#grid .card[aria-hidden="true"]')
    check('skeleton cards shown while loading', pg.locator('#grid .card[aria-hidden="true"]').count() >= 6)
    HOLD['on'] = False
    for r in held: r.fulfill(status=200, headers={**CORS, 'content-type': 'application/json'}, body=json.dumps(ROWS_FIX))
    pg.wait_for_selector('#grid .card[data-id]')
    prod_url, prod_headers = next((u, h) for u, h in seen_requests if '/rest/v1/products' in u)
    check('products read from Supabase: active only, public key sent', 'active=eq.true' in prod_url and prod_headers.get('apikey', '').startswith('sb_publishable_'), prod_url)
    n = pg.locator('#grid .card[data-id]').count()
    check('products replace skeletons', pg.locator('#grid .card[aria-hidden="true"]').count() == 0 and n >= 12, n)
    check('2-column grid', pg.evaluate("getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.split(' ').length") == 2)
    check('discount badge + product photo render', pg.locator('#grid .bg-sale').count() > 0 and pg.locator('#grid img[data-ph]').count() > 0)
    pg.wait_for_timeout(400)
    broken = pg.locator('#grid .card[data-id="hm-2"]')
    check('a photo that fails to load falls back to the emoji', broken.locator('img').count() == 0 and '🍳' in broken.inner_text())
    chips = pg.locator('#chips').inner_text()
    check('chips = real top-level categories with products (no promo, no empty)', all(n in chips for n in ('Agrovet', 'Phones & Accessories', 'Home & Kitchen')) and 'Kili Featured' not in chips and 'Empty Category' not in chips, chips)
    ch = pg.locator('#grid .card[data-id="chariot"]')
    check('pack sizes of one product are ONE card with From price and size count', ch.count() == 1 and 'From' in ch.inner_text() and '3 sizes' in ch.inner_text(), ch.inner_text() if ch.count() else 'missing')
    pg.screenshot(path=f'{OUT}/shot-home.png')

    # badges
    check('cart badge hidden when empty', all(not e.is_visible() for e in pg.locator('[data-badge="cart"]').all()))
    pg.locator('[data-add]').first.click()
    check('cart badge shows 1 (header + nav)', pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1' and pg.locator('#appbar [data-badge="cart"]').inner_text() == '1')
    check('deals badge = discounted products in the catalogue', pg.locator('#bottom-nav [data-badge="deals"]').inner_text() == str(DEALS_EXPECTED), pg.locator('#bottom-nav [data-badge="deals"]').inner_text())

    # pack-size product: the + button asks for the size instead of adding blindly
    ch.locator('[data-add]').click()
    check('+ on a multi-size card opens the size sheet (nothing added yet)', pg.locator('#sheet-quickbuy.open').count() == 1 and pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1')
    check('sheet lists the 3 real pack sizes; the sold-out size is disabled', pg.locator('#qb-sizes [data-size]').count() == 3 and pg.locator('#qb-sizes [data-size="1 L"]').is_disabled())
    check('default size is the first in stock, with its real price', pg.locator('#qb-price').inner_text() == 'KSh 300', pg.locator('#qb-price').inner_text())
    pg.locator('#qb-sizes [data-size="100 ml"]').click()
    check('choosing a size shows that size\'s own price', pg.locator('#qb-price').inner_text() == 'KSh 550' and pg.locator('#qb-old').inner_text() == '', pg.locator('#qb-price').inner_text())
    pg.locator('#qb-add').click(); pg.wait_for_timeout(350)
    saved = json.loads(pg.evaluate("localStorage.getItem('shell.cart2')"))
    check('cart line keeps the size row (sku, size, price)', any(i['sku'] == 'ag-100' and i['size'] == '100 ml' and i['price'] == 550 for i in saved), saved)
    check('sheet closes after Add to cart', pg.locator('#sheet-quickbuy.open').count() == 0 and pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '2')

    # quick buy + back button
    h0 = pg.evaluate('history.length')
    pg.locator('#grid .card[data-id]').nth(1).locator('p').first.click()
    check('quick buy sheet opens', pg.locator('#sheet-quickbuy.open').count() == 1)
    check('opening pushed a history entry that holds the sheet', pg.evaluate('history.state.stack') == ['sheet-quickbuy'], pg.evaluate('history.state'))
    check('body scroll locked', pg.evaluate("document.body.classList.contains('no-scroll')"))
    pg.wait_for_timeout(450); pg.screenshot(path=f'{OUT}/shot-quickbuy.png')
    pg.go_back()
    pg.wait_for_timeout(350)
    check('Back closes quick buy and stays on page', pg.locator('#sheet-quickbuy.open').count() == 0 and pg.url == URL, pg.url)
    check('scroll unlocked after close', not pg.evaluate("document.body.classList.contains('no-scroll')"))

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
    pg.locator('[data-drawer-cat="phones-accessories"]').click()
    pg.wait_for_timeout(900)
    check('drawer category selects chip, closes drawer', pg.locator('#drawer-categories.open').count() == 0 and pg.locator('#chips [data-chip="phones-accessories"][aria-selected="true"]').count() == 1)
    names = pg.evaluate("[...document.querySelectorAll('#grid .card[data-id]')].map(e=>e.dataset.id.split('-')[0])")
    check('grid shows only that category', names and set(names) == {'ph'} and len(names) == 6, set(names))
    pg.locator('#chips [data-chip="home-kitchen"]').click(); pg.wait_for_timeout(900)
    last = pg.locator('#grid .card[data-id]').last
    check('sold-out product is listed last, marked, and cannot be added', last.get_attribute('data-id') == 'hm-8' and 'Sold out' in last.inner_text() and last.locator('[data-add]').is_disabled())
    check('product-names.json heading is used on the card', 'Original Air Fryer 5L Pro' in pg.locator('#grid').inner_text())

    # tabs + history
    h1 = pg.evaluate('history.length')
    pg.locator('#bottom-nav [data-tab="categories"]').click()
    check('Categories tab active (aria-current)', pg.locator('#bottom-nav [data-tab="categories"][aria-current="page"]').count() == 1 and pg.locator('#view-categories').is_visible())
    check('leaving Home pushed an entry for the tab', pg.evaluate('history.state.tab') == 'categories')
    check('chips hidden off Home', not pg.locator('#chips-wrap').is_visible())
    pg.screenshot(path=f'{OUT}/shot-categories.png')
    pg.locator('#cat-side [data-side="agrovet"]').click()
    check('side list swaps right grid (real sub-category)', 'Fungicides' in pg.locator('#cat-main').inner_text())
    h1_after = pg.evaluate('history.length')
    pg.locator('#bottom-nav [data-tab="deals"]').click()
    check('hopping between non-home tabs replaces the entry', pg.evaluate('history.state.tab') == 'deals' and pg.evaluate('history.length') == h1_after)
    check('deals badge cleared on visit', not pg.locator('#bottom-nav [data-badge="deals"]').is_visible())
    pg.wait_for_selector('#deals-grid .card[data-id]')
    check('deals tab lists discounted products, including one from a promo category', pg.locator('#deals-grid .card[data-id="pr-1"]').count() == 1 and pg.locator('#deals-grid .card[data-id="hm-1"]').count() == 0)
    pg.go_back(); pg.wait_for_timeout(300)
    check('Back from a tab returns to Home (not off the site)', pg.locator('#view-home').is_visible() and pg.url == URL, pg.url)
    check('nav highlight follows Back', pg.locator('#bottom-nav [data-tab="home"][aria-current="page"]').count() == 1)

    # buy now flow
    pg.locator('#chips [data-chip="all"]').click(); pg.wait_for_timeout(900)
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

    check('no console/page errors', not [e for e in errors if 'missing-photo' not in e and '404' not in e and '500' not in e], errors[:3])

    # loading failure: retry line instead of endless skeletons, then recovery
    pg2 = ctx.new_page(); wire(pg2); HOLD['on'] = False; HOLD['fail'] = True
    pg2.goto(URL); pg2.wait_for_selector('#grid-empty:not([hidden])')
    check('failed load shows a retry line, no skeletons left', 'Could not load products' in pg2.locator('#grid-empty').inner_text() and pg2.locator('#grid .card[aria-hidden="true"]').count() == 0)
    HOLD['fail'] = False
    pg2.locator('#grid-empty').click(); pg2.wait_for_selector('#grid .card[data-id]')
    check('tapping retry loads the catalogue', pg2.locator('#grid .card[data-id]').count() >= 12 and pg2.locator('#grid-empty').is_hidden())
    b.close()

fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
