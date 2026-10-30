# Headless-mobile test of the shell. Needs: pip install playwright && playwright install chromium
# Run: python3 mobile-shell/shell.test.py   (screenshots go to the system temp folder)
import sys, threading, http.server, socketserver, functools, os, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = tempfile.gettempdir()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{port}/index.html'

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
    pg.goto(URL)

    # skeletons then products
    check('skeleton cards shown while loading', pg.locator('#grid .card[aria-hidden="true"]').count() >= 6)
    pg.wait_for_selector('#grid .card[data-id]')
    n = pg.locator('#grid .card[data-id]').count()
    check('products replace skeletons', pg.locator('#grid .card[aria-hidden="true"]').count() == 0 and n >= 12, n)
    check('2-column grid', pg.evaluate("getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.split(' ').length") == 2)
    check('discount badge + stars render', pg.locator('#grid .bg-sale').count() > 0 and pg.locator('#grid .stars').count() > 0)
    pg.screenshot(path=f'{OUT}/shot-home.png')

    # badges
    check('cart badge hidden when empty', all(not e.is_visible() for e in pg.locator('[data-badge="cart"]').all()))
    pg.locator('[data-add]').first.click()
    check('cart badge shows 1 (header + nav)', pg.locator('#bottom-nav [data-badge="cart"]').inner_text() == '1' and pg.locator('#appbar [data-badge="cart"]').inner_text() == '1')
    check('deals badge starts at 5', pg.locator('#bottom-nav [data-badge="deals"]').inner_text() == '5')

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
    pg.locator('[data-drawer-cat="phones"]').click()
    pg.wait_for_timeout(900)
    check('drawer category selects chip, closes drawer', pg.locator('#drawer-categories.open').count() == 0 and pg.locator('#chips [data-chip="phones"][aria-selected="true"]').count() == 1)
    names = pg.evaluate("[...document.querySelectorAll('#grid .card[data-id]')].map(e=>e.dataset.id.split('-')[0])")
    check('grid shows only that category', names and set(names) == {'phones'}, set(names))

    # tabs + history
    h1 = pg.evaluate('history.length')
    pg.locator('#bottom-nav [data-tab="categories"]').click()
    check('Categories tab active (aria-current)', pg.locator('#bottom-nav [data-tab="categories"][aria-current="page"]').count() == 1 and pg.locator('#view-categories').is_visible())
    check('leaving Home pushed an entry for the tab', pg.evaluate('history.state.tab') == 'categories')
    check('chips hidden off Home', not pg.locator('#chips-wrap').is_visible())
    pg.screenshot(path=f'{OUT}/shot-categories.png')
    pg.locator('#cat-side [data-side="agro"]').click()
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

    check('no console/page errors', not errors, errors[:3])
    b.close()

fails = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
