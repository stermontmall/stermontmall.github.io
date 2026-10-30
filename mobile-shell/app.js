/* Stermont Arcade mobile shell prototype.
   Vanilla JS, no framework. Data comes from Supabase (categories + products, read with the public key).
   Sections: 1 data (Supabase)  2 store + badges  3 history-backed overlays  4 tabs  5 header scroll
             6 grid + skeletons  7 categories  8 filters  9 quick buy  10 cart  11 wiring */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-KE');
const ls = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('shell.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('shell.' + k, JSON.stringify(v)); } catch {} }
};

/* ---------- 1. Data: Supabase (public key, read-only through the table's RLS rules) ---------- */
const SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
const rest = async path => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY }, cache: 'no-store' });
  if (!r.ok) throw new Error('Supabase ' + r.status);
  return r.json();
};
const ICONS = { agrovet: '🌱', appliances: '🔌', fashion: '👕', 'health-beauty': '💄', 'baby-products': '🍼', shoes: '👟', bags: '👜',
  'watches-jewellery': '⌚', automotive: '🚗', 'pest-control-fumigation': '🪳', 'phones-accessories': '📱', 'tv-audio-video': '📺',
  others: '🛍️', 'computers-accessories': '💻', 'home-kitchen': '🍳', 'kili-featured': '⭐' };
const BGS = ['#ede9fe', '#fce7f3', '#dcfce7', '#fef3c7', '#e0f2fe', '#ffe4e6', '#f1f5f9'];
let CATS = [];      // top-level categories that have products: { id: slug, name, icon, subs: [sub-category names] }
let PRODUCTS = [];  // one entry per product; pack sizes of one product (same variant_group) are one entry with several sizes
const discOf = p => p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;

/* Turn the category rows + product rows into CATS and PRODUCTS. `names` = product-names.json (id -> heading the product page shows). */
function buildCatalog(cats, rows, names) {
  const byId = new Map(cats.map(c => [c.id, c]));
  const topOf = c => { for (let n = 0; c && c.parent_id && byId.has(c.parent_id) && n < 5; n++) c = byId.get(c.parent_id); return c; };
  const groups = new Map();
  rows.forEach(r => { const k = r.variant_group || r.id; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const subsOf = new Map(), out = [];
  let i = 0;
  groups.forEach((g, key) => {
    const c = byId.get(g[0].category_id), top = topOf(c), slug = top ? top.slug : 'others';
    const lead = g.find(r => r.stock > 0) || g[0];
    const seen = new Set(), sizes = [], rowsBy = {};
    g.forEach((r, j) => {
      let label = String(r.variant_label || r.unit || '').trim() || (g.length > 1 ? 'Option ' + (j + 1) : 'Standard');
      if (seen.has(label)) label += ' #' + (j + 1);
      seen.add(label); sizes.push(label);
      const price = +r.price, old = +r.old_price;
      rowsBy[label] = { sku: r.id, price, old: old > price ? old : 0, stock: r.stock | 0, img: (r.images && r.images[0]) || '' };
    });
    const inStock = sizes.filter(s => rowsBy[s].stock > 0);
    const cheapest = (inStock.length ? inStock : sizes).reduce((a, s) => rowsBy[s].price < rowsBy[a].price ? s : a);
    const sub = c && c.parent_id ? c.name : '';
    if (top && sub) { if (!subsOf.has(slug)) subsOf.set(slug, new Set()); subsOf.get(slug).add(sub); }
    out.push({
      id: key, cat: slug, sub, name: names[lead.id] || lead.name, img: rowsBy[sizes[g.indexOf(lead)]].img || sizes.map(s => rowsBy[s].img).find(Boolean) || '',
      emoji: ICONS[slug] || '🛍️', bg: BGS[i++ % BGS.length], price: rowsBy[cheapest].price, old: rowsBy[cheapest].old,
      sizes, rows: rowsBy, defSize: inStock[0] || sizes[0], soldOut: !inStock.length, featured: g.some(r => r.featured),
      multi: new Set(sizes.map(s => rowsBy[s].price)).size > 1
    });
  });
  const usedTops = new Set(out.map(p => p.cat));
  CATS = cats.filter(c => !c.parent_id && !c.is_promo && usedTops.has(c.slug))
    .sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name))
    .map(c => ({ id: c.slug, name: c.name, icon: ICONS[c.slug] || '🛍️', subs: [...(subsOf.get(c.slug) || [])].sort() }));
  PRODUCTS = out;
}

let catalogP = null;
function loadCatalog() {
  if (catalogP) return catalogP;
  catalogP = Promise.all([
    rest('categories?select=id,name,slug,parent_id,sort_order,is_promo&order=sort_order.asc,name.asc'),
    rest('products?active=eq.true&select=id,name,price,old_price,stock,images,featured,category_id,variant_group,variant_label,unit,created_at&order=created_at.asc'),
    fetch('../product-names.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({}))
  ]).then(([cats, rows, names]) => buildCatalog(cats, rows, names && typeof names === 'object' ? names : {}))
    .catch(e => { catalogP = null; throw e; }); // a failed load can be retried
  return catalogP;
}

/* Filter / sort / page the loaded catalog. Resolves {items, hasMore}. */
async function fetchProducts({ cat = 'all', sub = '', q = '', sort = 'rec', min = 0, max = 0, disc = false, page = 1, size = 12 }) {
  await loadCatalog();
  const needle = q.trim().toLowerCase();
  const r = PRODUCTS.filter(p => (cat === 'all' || p.cat === cat) && (!sub || p.sub === sub) &&
    (!needle || p.name.toLowerCase().includes(needle) || p.sizes.some(s => s.toLowerCase().includes(needle))) &&
    (!min || p.price >= min) && (!max || p.price <= max) && (!disc || discOf(p) > 0));
  const by = sort === 'low' ? (a, b) => a.price - b.price : sort === 'high' ? (a, b) => b.price - a.price
    : sort === 'disc' ? (a, b) => discOf(b) - discOf(a) : (a, b) => b.featured - a.featured;
  r.sort((a, b) => a.soldOut - b.soldOut || by(a, b)); // sold-out products always last; sort is stable, so ties keep catalogue order
  return { items: r.slice((page - 1) * size, page * size), hasMore: r.length > page * size };
}

/* ---------- 2. Store + live badges ---------- */
const store = (() => {
  let s = { tab: 'home', cart: ls.get('cart2', []), dealsNew: 0, chip: 'all', sub: '', q: '', filters: { sort: 'rec', min: 0, max: 0, disc: false } };
  const subs = new Set();
  return {
    get: () => s,
    set(patch) { const prev = s; s = { ...s, ...patch }; subs.forEach(f => f(s, prev)); },
    subscribe(f) { subs.add(f); f(s, s); }
  };
})();
const cartCount = s => s.cart.reduce((n, i) => n + i.qty, 0);
const cartTotal = s => s.cart.reduce((n, i) => n + i.qty * i.price, 0);

function setBadge(name, n, prev) {
  $$(`[data-badge="${name}"]`).forEach(el => {
    el.textContent = n > 99 ? '99+' : n;
    el.hidden = n <= 0;
    if (n > prev) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
}
store.subscribe((s, prev) => {
  setBadge('cart', cartCount(s), cartCount(prev));
  setBadge('deals', s.dealsNew, prev.dealsNew);
  ls.set('cart2', s.cart);
});

/* ---------- 3. Overlays wired to browser history ----------
   Opening pushes a history entry holding the overlay stack; the device Back button (popstate)
   pops it and closes the overlay instead of leaving the page. UI close buttons call history.back()
   so the history stays in sync. Reload or forward into a stale entry never reopens a sheet. */
const OVERLAYS = ['drawer-categories', 'sheet-filters', 'sheet-quickbuy'];
let stack = [];
let afterClose = null;
let opener = null;
const scrim = $('#scrim');

function syncOverlays() {
  OVERLAYS.forEach(id => {
    const el = $('#' + id), on = stack.includes(id);
    el.classList.toggle('open', on);
    el.setAttribute('aria-hidden', String(!on));
    if (on) el.inert = false; else el.inert = true;
  });
  scrim.classList.toggle('open', stack.length > 0);
  document.body.classList.toggle('no-scroll', stack.length > 0);
}
function openOverlay(id) {
  if (stack.includes(id)) return;
  stack.push(id);
  history.pushState({ tab: store.get().tab, stack: [...stack] }, '');
  syncOverlays();
  const el = $('#' + id); const f = el.querySelector('button,input'); if (f) f.focus({ preventScroll: true });
}
const closeTop = () => { if (stack.length) history.back(); };
function closeAllThen(fn) { // close every overlay, then run fn once history has settled
  if (!stack.length) return fn();
  afterClose = fn; history.go(-stack.length);
}
window.addEventListener('popstate', e => {
  const st = e.state || { tab: 'home', stack: [] };
  stack = (st.stack || []).filter(id => OVERLAYS.includes(id) && !(id === 'sheet-quickbuy' && !qb.p));
  if (st.tab && st.tab !== store.get().tab) showTab(st.tab);
  syncOverlays();
  if (!stack.length && opener) { opener.focus?.({ preventScroll: true }); opener = null; }
  if (afterClose && !stack.length) { const f = afterClose; afterClose = null; f(); }
});
history.replaceState({ tab: 'home', stack: [] }, ''); // a reload lands on a clean base entry
scrim.addEventListener('click', closeTop);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTop(); });
syncOverlays();

/* ---------- 4. Tabs / bottom nav ---------- */
const scrollPos = {};
function showTab(tab) {
  const prev = store.get().tab;
  scrollPos[prev] = window.scrollY;
  store.set({ tab });
  $$('[data-view]').forEach(v => v.hidden = v.dataset.view !== tab);
  $$('#bottom-nav .nav-item').forEach(b => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#chips-wrap').hidden = tab !== 'home';
  $('#appbar').classList.remove('is-compact');
  if (tab === 'deals') { store.set({ dealsNew: 0 }); ls.set('dealsSeen', true); renderDeals(); }
  window.scrollTo(0, scrollPos[tab] || 0);
}
function goTab(tab) {
  closeAllThen(() => {
    const cur = store.get().tab;
    if (tab === cur) return window.scrollTo({ top: 0, behavior: 'smooth' });
    const st = { tab, stack: [] };
    // leaving Home adds one history entry so Back returns to Home; other tab hops replace
    if (cur === 'home') history.pushState(st, ''); else history.replaceState(st, '');
    showTab(tab);
  });
}

/* ---------- 5. Header scroll behaviour ---------- */
(() => {
  const bar = $('#appbar'); let lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, dy = y - lastY;
      if (y > 60 && dy > 6) bar.classList.add('is-compact');
      else if (dy < -6 || y < 10) bar.classList.remove('is-compact');
      if (Math.abs(dy) > 6) lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();

/* ---------- 6. Product grid + skeletons ---------- */
/* Photo laid over the emoji placeholder; a photo that fails to load is removed so the placeholder shows (see the error listener in section 11). */
const imgTag = o => o.img ? `<img data-ph src="${esc(o.img)}" alt="${esc(o.name)}" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#fff">` : '';
function cardHTML(p) {
  const d = discOf(p);
  return `<li class="card" data-id="${esc(p.id)}">
    <div class="relative aspect-square grid place-items-center text-6xl overflow-hidden" style="background:${p.bg}">${p.emoji}${imgTag(p)}
      ${d ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sale text-white text-2xs font-semibold z-10">-${d}%</span>` : ''}
    </div>
    <div class="p-2">
      <p class="text-xs leading-4 line-clamp-2 min-h-8">${esc(p.name)}</p>
      <p class="mt-1 flex items-baseline gap-1 flex-wrap">${p.multi ? '<span class="text-2xs text-mute">From</span>' : ''}<span class="text-sale font-bold text-sm">KSh ${fmt(p.price)}</span>${p.old ? `<s class="text-mute text-2xs">${fmt(p.old)}</s>` : ''}</p>
      <div class="mt-1 flex items-center justify-between">
        <span class="text-2xs text-mute">${p.soldOut ? 'Sold out' : p.sizes.length > 1 ? p.sizes.length + ' sizes' : ''}</span>
        <button class="icon-btn bg-brand text-white !w-7 !h-7" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to cart"${p.soldOut ? ' disabled style="opacity:.4"' : ''}><svg class="w-4 h-4"><use href="#i-plus"/></svg></button>
      </div>
    </div></li>`;
}
const SKELETON = `<li class="card pointer-events-none" aria-hidden="true"><div class="skel aspect-square !rounded-none"></div><div class="p-2 space-y-2"><div class="skel h-3 w-full"></div><div class="skel h-3 w-2/3"></div><div class="skel h-4 w-1/2"></div></div></li>`;
const skeletons = n => SKELETON.repeat(n);

const grid = $('#grid'), sentinel = $('#sentinel');
const feed = { page: 1, hasMore: true, loading: false, token: 0, items: new Map() };

function query() {
  const s = store.get();
  return { cat: s.chip, sub: s.sub, q: s.q, ...s.filters };
}
function showEmpty(on, msg) {   // msg given = load error (tapping it retries); otherwise the "no matches" line
  const el = $('#grid-empty'); el.hidden = !on;
  el.textContent = msg || 'No products match these filters.'; el.toggleAttribute('data-retry', !!msg);
}
async function loadPage(reset) {
  if (feed.loading && !reset) return;
  if (reset) { feed.page = 1; feed.hasMore = true; feed.token++; grid.innerHTML = ''; showEmpty(false); }
  if (!feed.hasMore) return;
  const token = feed.token; feed.loading = true;
  grid.insertAdjacentHTML('beforeend', skeletons(reset ? 6 : 4));
  let res;
  try { res = await fetchProducts({ ...query(), page: feed.page }); }
  catch {
    if (token !== feed.token) return;
    $$('.card[aria-hidden="true"]', grid).forEach(n => n.remove());
    feed.loading = false; feed.hasMore = false; showEmpty(true, 'Could not load products. Tap to retry.'); return;
  }
  if (token !== feed.token) return;            // a newer query started: drop this stale answer
  const { items, hasMore } = res;
  $$('.card[aria-hidden="true"]', grid).forEach(n => n.remove());
  items.forEach(p => feed.items.set(p.id, p));
  grid.insertAdjacentHTML('beforeend', items.map(cardHTML).join(''));
  feed.page++; feed.hasMore = hasMore; feed.loading = false;
  showEmpty(grid.children.length === 0);
  if (feed.hasMore && store.get().tab === 'home' && sentinel.getBoundingClientRect().top < innerHeight + 400) loadPage(false);
}
new IntersectionObserver(es => { if (es[0].isIntersecting && store.get().tab === 'home') loadPage(false); }, { rootMargin: '400px' }).observe(sentinel);

function refreshGrid() {
  const s = store.get(), cat = CATS.find(c => c.id === s.chip);
  $('#grid-title').textContent = s.q ? `Results for "${s.q}"` : s.sub || (cat ? cat.name : 'Recommended for you');
  renderChips(); loadPage(true);
}
async function renderDeals() {
  const el = $('#deals-grid'); if (el.dataset.loaded) return;
  el.innerHTML = skeletons(6);
  let items;
  try { ({ items } = await fetchProducts({ sort: 'disc', disc: true, size: 24 })); }
  catch { el.innerHTML = '<li class="col-span-2 text-center text-mute py-10" data-retry-deals>Could not load deals. Tap to retry.</li>'; return; }
  items.forEach(p => feed.items.set(p.id, p));
  el.innerHTML = items.length ? items.map(cardHTML).join('') : '<li class="col-span-2 text-center text-mute py-10">No deals right now.</li>'; el.dataset.loaded = '1';
}

/* ---------- 7. Chips, category view, drawer ---------- */
const chips = () => [{ id: 'all', name: 'For you' }, ...CATS];
function renderChips() {
  const s = store.get();
  $('#chips').innerHTML = chips().map(c => `<button class="chip" role="tab" data-chip="${esc(c.id)}" aria-selected="${c.id === s.chip}">${esc(c.name)}</button>`).join('');
  $('#chips [aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function selectCategory(chip, sub = '') {
  store.set({ chip, sub, q: '' }); $('#search').value = '';
  if (store.get().tab !== 'home') goTab('home'); // goTab keeps history consistent
  refreshGrid();
}
let sideCat = '';
function renderCategoriesView() {
  $('#cat-side').innerHTML = CATS.map(c => `<button class="cat-side" role="tab" data-side="${esc(c.id)}" aria-selected="${c.id === sideCat}">${esc(c.name)}</button>`).join('');
  const c = CATS.find(x => x.id === sideCat);
  if (!c) { $('#cat-main').innerHTML = ''; return; }
  $('#cat-main').innerHTML = `<button class="tap w-full text-left mb-3 flex items-center justify-between font-semibold" data-cat-all="${esc(c.id)}">${esc(c.name)}<span class="text-xs text-brand font-normal">View all &rsaquo;</span></button>
    <ul class="grid grid-cols-3 gap-y-4 gap-x-2">${c.subs.map(sb => `<li><button class="tap w-full flex flex-col items-center gap-1.5" data-cat="${esc(c.id)}" data-sub="${esc(sb)}">
      <span class="w-14 h-14 rounded-full grid place-items-center text-2xl" style="background:${BGS[sb.length % BGS.length]}">${c.icon}</span>
      <span class="text-xs text-center leading-4">${esc(sb)}</span></button></li>`).join('')}</ul>`;
}
const renderDrawer = () => { $('#drawer-cats').innerHTML = CATS.map(c => `<li><button class="tap w-full flex items-center gap-3 px-4 py-3.5 border-b border-line text-left" data-drawer-cat="${esc(c.id)}"><span class="text-xl">${c.icon}</span>${esc(c.name)}</button></li>`).join(''); };

/* ---------- 8. Filters sheet ---------- */
const activeFilterCount = f => (f.sort !== 'rec') + !!f.min + !!f.max + f.disc;
function syncFilterUI() {
  const f = store.get().filters;
  $$('#f-sort .chip').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sort === f.sort)));
  $('#f-min').value = f.min || ''; $('#f-max').value = f.max || ''; $('#f-disc').checked = f.disc;
  const n = activeFilterCount(f), badge = $('#filter-count'); badge.hidden = !n; badge.textContent = `(${n})`;
}
let draftSort = 'rec';
$('#f-sort').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  draftSort = b.dataset.sort; $$('#f-sort .chip').forEach(x => x.setAttribute('aria-selected', String(x === b)));
});
$('#f-apply').addEventListener('click', () => {
  store.set({ filters: { sort: draftSort, min: +$('#f-min').value || 0, max: +$('#f-max').value || 0, disc: $('#f-disc').checked } });
  syncFilterUI(); refreshGrid(); closeTop();
});
$('#f-reset').addEventListener('click', () => {
  draftSort = 'rec'; store.set({ filters: { sort: 'rec', min: 0, max: 0, disc: false } }); syncFilterUI(); refreshGrid();
});

/* ---------- 9. Quick buy sheet ---------- */
const qb = { p: null, size: '', qty: 1 };
const sizePrice = (p, size) => p.rows[size].price; // each pack size is its own products row with its own price
function renderQB() {
  const { p } = qb; if (!p) return;
  const row = p.rows[qb.size], out = row.stock <= 0;
  const qi = $('#qb-img'); qi.style.background = p.bg; qi.style.position = 'relative'; qi.style.overflow = 'hidden';
  qi.textContent = p.emoji; qi.insertAdjacentHTML('beforeend', imgTag({ img: row.img || p.img, name: p.name }));
  $('#qb-name').textContent = p.name; $('#qb-price').textContent = 'KSh ' + fmt(row.price);
  $('#qb-old').textContent = row.old ? 'KSh ' + fmt(row.old) : '';
  $('#qb-qty').textContent = qb.qty;
  $('#qb-add').disabled = $('#qb-buy').disabled = out;
  $('#qb-sizes').innerHTML = p.sizes.map(s => `<button class="chip !h-9 !px-4" data-size="${esc(s)}" aria-selected="${s === qb.size}"${p.rows[s].stock > 0 ? '' : ' disabled style="opacity:.45"'}>${esc(s)}</button>`).join('');
}
function openQuickBuy(id) {
  const p = feed.items.get(id); if (!p) return;
  qb.p = p; qb.size = p.defSize; qb.qty = 1; renderQB(); openOverlay('sheet-quickbuy');
}
$('#qb-sizes').addEventListener('click', e => { const b = e.target.closest('[data-size]'); if (b) { qb.size = b.dataset.size; qb.qty = Math.max(1, Math.min(qb.qty, qb.p.rows[qb.size].stock)); renderQB(); } });
$('#qb-plus').addEventListener('click', () => { qb.qty = Math.min(99, qb.p.rows[qb.size].stock, qb.qty + 1); renderQB(); });
$('#qb-minus').addEventListener('click', () => { qb.qty = Math.max(1, qb.qty - 1); renderQB(); });
function addToCart(p, size, qty) {
  const row = p.rows[size], key = p.id + '|' + size, cart = store.get().cart.map(i => ({ ...i })), hit = cart.find(i => i.key === key);
  if (hit) hit.qty = Math.min(row.stock, hit.qty + qty);
  else cart.push({ key, id: p.id, sku: row.sku, name: p.name, size, qty: Math.min(row.stock, qty), price: row.price, max: row.stock, img: row.img || p.img, emoji: p.emoji, bg: p.bg });
  store.set({ cart });
}
$('#qb-add').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); toast('Added to cart'); closeTop(); });
$('#qb-buy').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); goTab('cart'); });

/* ---------- 10. Cart view ---------- */
store.subscribe(s => {
  const n = cartCount(s);
  $('#cart-title-count').textContent = n ? `(${n})` : '';
  $('#cart-empty').hidden = n > 0; $('#cart-total-bar').hidden = n === 0;
  $('#cart-total').textContent = 'KSh ' + fmt(cartTotal(s));
  $('#cart-list').innerHTML = s.cart.map(i => `<li class="flex gap-3 bg-white rounded-lg p-2 shadow-card">
    <div class="w-20 h-20 rounded-lg shrink-0 grid place-items-center text-4xl" style="background:${i.bg};position:relative;overflow:hidden">${i.emoji}${imgTag(i)}</div>
    <div class="flex-1 min-w-0 flex flex-col justify-between">
      <div><p class="text-xs line-clamp-2">${esc(i.name)}</p><p class="text-2xs text-mute">${esc(i.size)}</p></div>
      <div class="flex items-center justify-between"><span class="text-sale font-bold">KSh ${fmt(i.price)}</span>
        <span class="flex items-center gap-2">
          <button class="icon-btn bg-gray-100 !w-7 !h-7" data-qty="${esc(i.key)}" data-d="-1" aria-label="Less"><svg class="w-3.5 h-3.5"><use href="#i-minus"/></svg></button>
          <span class="w-5 text-center text-sm font-semibold">${i.qty}</span>
          <button class="icon-btn bg-gray-100 !w-7 !h-7" data-qty="${esc(i.key)}" data-d="1" aria-label="More"><svg class="w-3.5 h-3.5"><use href="#i-plus"/></svg></button>
        </span></div></div></li>`).join('');
});
$('#cart-list').addEventListener('click', e => {
  const b = e.target.closest('[data-qty]'); if (!b) return;
  const cart = store.get().cart.map(i => i.key === b.dataset.qty ? { ...i, qty: Math.min(i.max || 99, i.qty + +b.dataset.d) } : i).filter(i => i.qty > 0);
  store.set({ cart });
});
$('#checkout').addEventListener('click', () => toast('Prototype: M-Pesa checkout would start here'));

/* ---------- 11. Wiring ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.style.opacity = 1;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = 0, 1600);
}
document.addEventListener('click', e => {
  const t = e.target;
  let el;
  if ((el = t.closest('[data-tab]'))) return goTab(el.dataset.tab);
  if ((el = t.closest('[data-open]'))) { opener = el; if (el.dataset.open === 'sheet-filters') { draftSort = store.get().filters.sort; syncFilterUI(); } return openOverlay(el.dataset.open); }
  if ((el = t.closest('[data-close]'))) return closeTop();
  if ((el = t.closest('[data-add]'))) { // several pack sizes: let the shopper pick the size first
    const p = feed.items.get(el.dataset.add); if (!p || p.soldOut) return;
    if (p.sizes.length > 1) { opener = el; return openQuickBuy(p.id); }
    addToCart(p, p.defSize, 1); toast('Added to cart'); return;
  }
  if (t.closest('#grid-empty[data-retry]')) return refreshGrid();
  if (t.closest('[data-retry-deals]')) { delete $('#deals-grid').dataset.loaded; return renderDeals(); }
  if ((el = t.closest('#chips [data-chip]'))) return selectCategory(el.dataset.chip);
  if ((el = t.closest('[data-side]'))) { sideCat = el.dataset.side; return renderCategoriesView(); }
  if ((el = t.closest('[data-cat-all]'))) return selectCategory(el.dataset.catAll);
  if ((el = t.closest('[data-cat]'))) return selectCategory(el.dataset.cat, el.dataset.sub);
  if ((el = t.closest('[data-drawer-cat]'))) { const id = el.dataset.drawerCat; return closeAllThen(() => selectCategory(id)); }
  if ((el = t.closest('.card[data-id]'))) return openQuickBuy(el.dataset.id);
});
$('#search-form').addEventListener('submit', e => {
  e.preventDefault(); $('#search').blur();
  store.set({ q: $('#search').value.trim(), chip: 'all', sub: '' });
  if (store.get().tab !== 'home') goTab('home');
  refreshGrid();
});

// a photo that fails to load is dropped so the emoji placeholder underneath shows
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.hasAttribute('data-ph')) e.target.remove(); }, true);

syncFilterUI(); refreshGrid();   // skeletons show while the catalogue loads
loadCatalog().then(() => {
  sideCat = CATS[0] ? CATS[0].id : '';
  renderChips(); renderCategoriesView(); renderDrawer();
  if (!ls.get('dealsSeen')) store.set({ dealsNew: Math.min(99, PRODUCTS.filter(p => discOf(p) > 0).length) });
}).catch(() => {});             // the grid itself shows the retry line
})();
