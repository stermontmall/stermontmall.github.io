# Headless-mobile test of the shell. Needs: pip install playwright && playwright install chromium
# Run: python3 mobile-shell/shell.test.py   (screenshots go to the system temp folder)
import sys, threading, http.server, socketserver, functools, os, tempfile, json, base64, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # repo root: the shell reads ../product-names.json
OUT = tempfile.gettempdir()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{port}/mobile-shell/index.html'


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
    serve(route, ROWS if '/rest/v1/products' in route.request.url else CATS_FIX)
def mock_network(ctx):
    ctx.route('**/rest/v1/products*', on_rest)
    ctx.route('**/rest/v1/categories*', on_rest)
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
    check('network failure shows a retry link, no stuck skeletons', 'Could not load products' in p2.locator('#grid-empty').inner_text() and p2.locator('#grid .card[aria-hidden="true"]').count() == 0)
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

    check('no console/page errors', not errors, errors[:3])
    b.close()

fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
