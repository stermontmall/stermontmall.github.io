"""Admin "Service media" + public services pages test (headless Chromium, mocked Supabase).
Run: python3 admin-service-media.test.py   (needs: pip install playwright && playwright install chromium)
Covers: new post with photos for a pest page, general post, edit (title, remove/add photo), hide, pin, filter, delete (files removed),
service settings (notice, price override, validation), and that /services/ pages show posts, notice and price override. 34 checks.
"""
import json, os, re, subprocess, sys, time, base64, uuid, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.abspath(__file__))
SB = 'https://oewvtbnmyombbtggamor.supabase.co'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
import tempfile
TMP = tempfile.mkdtemp()
open(TMP + '/a.png', 'wb').write(PNG)
open(TMP + '/b.png', 'wb').write(PNG)
open(TMP + '/c.png', 'wb').write(PNG)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
srv.allow_reuse_address = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{PORT}'

posts, cat, storage, calls = [], {}, set(), []
fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (' :: ' + str(extra) if (extra and not cond) else ''))
    if not cond: fails.append(name)

def handle(route, req):
    url = req.url; m = req.method; path = url.replace(SB, '')
    calls.append((m, path))
    cors = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}
    if m == 'OPTIONS':
        return route.fulfill(status=204, headers=cors)
    def js(o, s=200): route.fulfill(status=s, headers=dict(cors, **{'content-type': 'application/json'}), body=json.dumps(o))
    if path.startswith('/storage/v1/object/public/'):
        return route.fulfill(status=200, headers=dict(cors, **{'content-type': 'image/png'}), body=PNG)
    if path.startswith('/storage/v1/object/service-media/'):
        p = path.split('/storage/v1/object/service-media/')[1]
        if m == 'POST': storage.add(p); return js({'Key': 'service-media/' + p})
        if m == 'DELETE': storage.discard(p); return js({'message': 'ok'})
    if path.startswith('/rest/v1/service_posts'):
        if m == 'GET': return js(sorted(posts, key=lambda p: (not p['pinned'], p['created_at']), reverse=False))
        if m == 'POST':
            b = json.loads(req.post_data); b.update(id=str(uuid.uuid4()), created_at='2026-10-31T10:00:00Z', updated_at='2026-10-31T10:00:00Z'); b.setdefault('published', True); b.setdefault('pinned', False)
            posts.append(b); return js([{'id': b['id']}], 201)
        pid = re.search(r'id=eq\.([^&]+)', path).group(1)
        hit = [p for p in posts if p['id'] == pid]
        if m == 'PATCH':
            if hit: hit[0].update(json.loads(req.post_data))
            return js([{'id': pid}] if hit else [])
        if m == 'DELETE':
            for p in hit: posts.remove(p)
            return js([{'id': pid}] if hit else [])
    if path.startswith('/rest/v1/service_catalog'):
        if m == 'GET': return js(list(cat.values()))
        if m == 'POST':
            b = json.loads(req.post_data); cat[b['slug']] = b; return js([b], 201)
        if m == 'DELETE':
            s = re.search(r'slug=eq\.([^&]+)', path).group(1); r = cat.pop(s, None); return js([{'slug': s}] if r else [])
    if path.startswith('/rest/v1/'): return js([])
    return js({})

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 800})
    errs = []
    ctx.route('**/*', lambda r, q=None: None)  # placeholder, replaced below
    ctx.unroute('**/*')
    ctx.route(SB + '/**', handle)
    ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1)(?!oewvtbnmyombbtggamor).*'), lambda r: r.abort())
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_FAILED' not in m.text else None)
    sess = {'access_token': 'x.y.z', 'refresh_token': 'r', 'email': 'staff@test.ke', 'exp': int(time.time() * 1000) + 3600000}
    pg.add_init_script("localStorage.setItem('stm_admin_session', %s)" % json.dumps(json.dumps(sess)))
    pg.goto(BASE + '/admin.html#media'); pg.wait_for_selector('.sm-seg', timeout=15000)
    pg.wait_for_selector('.sm select', timeout=5000)
    opts = pg.eval_on_selector('.sm select', 'e=>[...e.options].map(o=>o.value)')
    check('service dropdown has General + 8 services + 2 extra + 22 pests', len(opts) == 1 + 8 + 2 + 22, len(opts))
    check('bed-bugs pest option present', 'bed-bugs' in opts)
    check('form + Post button', pg.locator('button.btn', has_text='Post').count() >= 1)

    # CREATE post with 2 photos for a pest page
    pg.select_option('.sm select >> nth=0', 'bed-bugs')
    pg.fill('.sm input[type=text] >> nth=0', 'Bed bug job Kilimani')
    pg.fill('.sm input[type=text] >> nth=1', 'Nairobi')
    pg.set_input_files('.sm input[type=file]', [TMP + '/a.png', TMP + '/b.png'])
    pg.wait_for_selector('.sm-prev .sm-th >> nth=1')
    pg.click('button.btn:text-is("Post")')
    try:
        pg.wait_for_selector('.sm-media', timeout=10000)
    except Exception:
        print('DEBUG posts', posts); print('DEBUG calls', calls[-8:]); print('DEBUG errs', errs); print('DEBUG text', pg.inner_text('body')[:900]); raise
    check('post saved with 2 media', len(posts) == 1 and len(posts[0]['media']) == 2, posts)
    pst = posts[0]
    check('media shape {url,type}', all(m['url'].startswith('https://') and m['type'] == 'image' for m in pst['media']), pst['media'])
    check('slug saved', pst['service_slug'] == 'bed-bugs')
    check('2 files uploaded', len(storage) == 2, storage)
    check('post in list', pg.locator('.card:has-text("Bed bug job Kilimani")').count() >= 1)
    check('form reset after post', pg.input_value('.sm input[type=text] >> nth=0') == '')

    # General post, text only
    pg.select_option('.sm select >> nth=0', '')
    pg.fill('.sm input[type=text] >> nth=0', 'Tip: seal cracks')
    pg.fill('.sm textarea >> nth=0', 'Seal gaps before treatment.')
    pg.click('button.btn:text-is("Post")')
    pg.wait_for_function('document.querySelectorAll(".card .ref").length>=3', timeout=8000)
    check('general post saved with null slug', any(p_['service_slug'] is None for p_ in posts), posts)

    # EDIT: change title, remove first photo, add a new one
    card = pg.locator('.card:has-text("Bed bug job Kilimani")').last
    card.locator('button:has-text("Edit")').click()
    pg.wait_for_selector('.card:has-text("Edit post")')
    ed = pg.locator('.card:has-text("Edit post")')
    ed.locator('input[type=text]').first.fill('Bed bug job Kilimani (edited)')
    ed.locator('.sm-th .x').first.click()
    ed.locator('input[type=file]').set_input_files(TMP + '/c.png')
    old_paths = {m['url'] for m in pst['media']}
    ed.locator('button:has-text("Save changes")').click()
    pg.wait_for_function('document.body.innerText.includes("Saved: Bed bug job Kilimani (edited)")', timeout=8000)
    pst = [p_ for p_ in posts if p_['service_slug'] == 'bed-bugs'][0]
    check('edit saved title', pst['title'].endswith('(edited)'))
    check('edit media = 2 (1 kept + 1 new)', len(pst['media']) == 2, pst['media'])
    check('removed file deleted from storage after save', len(storage) == 2, storage)
    check('edit sent PATCH', any(c[0] == 'PATCH' for c in calls))

    # HIDE / PIN / DELETE
    card = pg.locator('.card:has-text("Tip: seal cracks")').last
    card.locator('button:has-text("Hide")').click(); pg.wait_for_function('document.body.innerText.includes("Saved.")')
    check('hide worked', [p_ for p_ in posts if p_['title'] == 'Tip: seal cracks'][0]['published'] is False)
    pg.locator('.card:has-text("Tip: seal cracks")').last.locator('button:has-text("Pin to top")').click()
    pg.wait_for_function('document.querySelector(".card .ref") && document.body.innerText.includes("Pin")')
    pg.wait_for_timeout(300)
    check('pin worked', [p_ for p_ in posts if p_['title'] == 'Tip: seal cracks'][0]['pinned'] is True)
    # filter: hidden only
    pg.select_option('.sm select >> nth=3', 'hidden'); pg.wait_for_timeout(200)
    check('status filter hidden shows 1', pg.locator('.card:has(.ref:has-text("Tip: seal cracks"))').count() == 1 and pg.locator('.card:has(.ref:has-text("(edited)"))').count() == 0, (pg.locator('.card:has-text("Tip: seal cracks")').count(), pg.locator('.card:has-text("(edited)")').count(), pg.eval_on_selector_all('.card .ref','e=>e.map(x=>x.textContent)'), [(q['title'],q['published']) for q in posts]))
    pg.select_option('.sm select >> nth=3', ''); pg.wait_for_timeout(200)
    n_files = len(storage)
    pg.locator('.card:has-text("(edited)")').last.locator('button:has-text("Delete")').click()
    pg.click('#cf-y'); pg.wait_for_function('document.body.innerText.includes("Post deleted.")', timeout=6000)
    check('delete removed post', not any('(edited)' in p_['title'] for p_ in posts))
    check('delete removed its files', len(storage) == n_files - 2, storage)

    # SETTINGS
    pg.click('button:has-text("Service settings")'); pg.wait_for_selector('.sm:has-text("Taking new bookings")', timeout=8000)
    check('settings: 8 service cards', pg.locator('.card:has-text("Taking new bookings")').count() == 8, pg.locator('.card:has-text("Taking new bookings")').count())
    c0 = pg.locator('.card:has-text("Taking new bookings")').first
    c0.locator('textarea').first.fill('Fully booked until 5 November.')
    c0.locator('input[type=number]').nth(0).fill('4000')
    c0.locator('button:has-text("Save settings")').click(); pg.wait_for_timeout(300)
    check('settings: both prices required', 'Fill both' in pg.inner_text('body'))
    c0.locator('input[type=number]').nth(1).fill('30000')
    c0.locator('button:has-text("Save settings")').click(); pg.wait_for_function('document.body.innerText.includes("Saved settings for")', timeout=8000)
    row = cat.get('pest-control-fumigation-nairobi')
    check('catalog row saved', row and row['notice'].startswith('Fully booked') and row['price_min'] == 4000 and row['price_max'] == 30000 and row['active'] is True, row)
    check('reset button now shown', pg.locator('button:has-text("Reset to standard")').count() == 1)
    check('no page errors in admin', not errs, errs)
    admin_errs = list(errs)

    # PUBLIC pages read the data
    posts.append({'id': 'p-live', 'created_at': '2026-10-31T09:00:00Z', 'service_slug': 'bed-bugs', 'kind': 'completed', 'title': 'Live bed bug job', 'body': 'Done in one visit.', 'town': 'Nairobi', 'published': True, 'pinned': False, 'media': [{'url': SB + '/storage/v1/object/public/service-media/x.png', 'type': 'image'}]})
    posts.append({'id': 'p-par', 'created_at': '2026-10-31T09:30:00Z', 'service_slug': 'pest-control-fumigation-nairobi', 'kind': 'update', 'title': 'Parent pest post', 'body': 'x', 'town': None, 'published': True, 'pinned': False, 'media': [{'u': SB + '/storage/v1/object/public/service-media/y.png', 't': 'image'}]})
    for pth in ['/services/pests/bed-bugs.html', '/services/pest-control-fumigation-nairobi.html', '/services/']:
        errs.clear()
        pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        pg2.goto(BASE + pth); pg2.wait_for_timeout(3500)
        txt = pg2.inner_text('body')
        if pth.endswith('bed-bugs.html'):
            check('pest page shows its post', 'Live bed bug job' in txt, txt[:200])
            check('pest page shows parent pest-control post', 'Parent pest post' in txt)
            check('parent notice shown on pest page', 'Fully booked until 5 November' in txt)
        elif 'pest-control-fumigation' in pth:
            check('service page shows its post (url/type and u/t keys)', 'Parent pest post' in txt)
            check('service page notice', 'Fully booked until 5 November' in txt, ('notes', pg2.eval_on_selector_all('.sp-note','e=>e.map(x=>x.textContent)'), 'cat', cat, calls[-6:]))
            check('service page price override 4,000', '4,000' in txt, [l for l in txt.split('\n') if 'KSh' in l][:3])
        else:
            check('hub loads, no JS error', not errs, errs)
        check('no page errors on ' + pth, not errs, errs)
        pg2.close()
    b.close()
print('\nFAILED:', fails if fails else 'none')
sys.exit(1 if fails else 0)
