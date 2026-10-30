/* Stermont Arcade mobile shell prototype.
   Vanilla JS, no framework. Data is mocked: swap fetchProducts() for the Supabase call.
   Sections: 1 data  2 store + badges  3 history-backed overlays  4 tabs  5 header scroll
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

/* ---------- 1. Mock data (deterministic) ---------- */
const CATS = [
  { id: 'pest', name: 'Pest Control', icon: '🪳', subs: ['Insecticides', 'Bed bug killers', 'Rodenticides', 'Fumigation', 'Sprayers', 'Baits & traps'],
    items: ['Bed Bug Killer Spray', 'Cockroach Gel Bait', 'Rat Poison Blocks', 'Mosquito Fogging Concentrate', 'Knapsack Sprayer 16L', 'Ant & Termite Killer', 'Fly Bait Granules', 'Fumigation Tablets'] },
  { id: 'agro', name: 'Agrovet & Farm', icon: '🌱', subs: ['Fungicides', 'Herbicides', 'Fertilizers', 'Growth boosters', 'Crop insecticides', 'Seed care'],
    items: ['Systemic Fungicide', 'Broad-spectrum Herbicide', 'Foliar Fertilizer', 'Rooting Hormone Powder', 'Crop Insecticide EC', 'Calcium Booster', 'Seed Treatment', 'Sticky Trap Roll'] },
  { id: 'phones', name: 'Phones & Tablets', icon: '📱', subs: ['Smartphones', 'Tablets', 'Power banks', 'Earbuds', 'Chargers', 'Smartwatches'],
    items: ['Smartphone 4GB/128GB', 'Budget Phone 3GB/64GB', 'Tablet 10-inch', 'Power Bank 20000mAh', 'Wireless Earbuds', 'Phone Case', 'Fast Charger 33W', 'Smartwatch'] },
  { id: 'tv', name: 'TVs & Audio', icon: '📺', subs: ['Smart TVs', 'Soundbars', 'Speakers', 'Home theatre', 'Mounts', 'Cables'],
    items: ['32" Smart TV', '43" Frameless TV', 'Soundbar 2.1', 'Bluetooth Speaker', 'Home Theatre System', 'TV Wall Mount', 'HDMI Cable 2m', 'Streaming Stick'] },
  { id: 'home', name: 'Home Appliances', icon: '🍳', subs: ['Air fryers', 'Kettles', 'Blenders', 'Microwaves', 'Cookers', 'Fans'],
    items: ['Air Fryer 5L', 'Electric Kettle 1.8L', 'Blender 1.5L', 'Microwave 20L', 'Rice Cooker 1.8L', 'Hot Plate', 'Iron Box', 'Standing Fan'] },
  { id: 'fashion', name: 'Fashion', icon: '👟', subs: ['Sneakers', 'Shirts', 'Handbags', 'Jackets', 'Watches', 'Accessories'],
    items: ['Running Sneakers', 'Men Polo Shirt', 'Ladies Handbag', 'Denim Jacket', 'Wrist Watch', 'Sunglasses', 'Leather Belt', 'School Backpack'] },
  { id: 'computing', name: 'Computing', icon: '💻', subs: ['Laptops', 'Mice', 'Keyboards', 'Storage', 'Monitors', 'Networking'],
    items: ['Laptop 15.6" 8GB', 'Wireless Mouse', 'Mechanical Keyboard', 'USB Flash Drive 64GB', 'External HDD 1TB', 'Laptop Bag', 'Monitor 24"', 'WiFi Router'] }
];
const BGS = ['#ede9fe', '#fce7f3', '#dcfce7', '#fef3c7', '#e0f2fe', '#ffe4e6', '#f1f5f9'];
const SIZE_SETS = [['50 ml', '100 ml', '250 ml', '1 L'], ['Standard'], ['Small', 'Medium', 'Large'], ['Standard', 'Bundle of 2']];
const PRODUCTS = (() => {
  let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const out = [];
  CATS.forEach((c, ci) => c.items.forEach((name, i) => {
    const price = Math.round((150 + rnd() * rnd() * 60000) / 10) * 10;
    const hasOld = rnd() > 0.35;
    out.push({
      id: c.id + '-' + i, cat: c.id, sub: c.subs[i % c.subs.length], name, emoji: c.icon, bg: BGS[(ci + i) % BGS.length],
      price, old: hasOld ? Math.round(price * (1.12 + rnd() * 0.5) / 10) * 10 : 0,
      rating: Math.round((3.4 + rnd() * 1.6) * 10) / 10, reviews: Math.round(3 + rnd() * 400),
      sizes: SIZE_SETS[(ci + i) % SIZE_SETS.length]
    });
  }));
  return out;
})();
const discOf = p => p.old ? Math.round((1 - p.price / p.old) * 100) : 0;

/* Replace the body of this with the Supabase query. Must resolve {items, hasMore}. */
function fetchProducts({ cat = 'all', sub = '', q = '', sort = 'rec', min = 0, max = 0, disc = false, page = 1, size = 12 }) {
  return new Promise(res => setTimeout(() => {
    let r = PRODUCTS.filter(p => (cat === 'all' || p.cat === cat) && (!sub || p.sub === sub) &&
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!min || p.price >= min) && (!max || p.price <= max) && (!disc || discOf(p) > 0));
    if (sort === 'low') r.sort((a, b) => a.price - b.price);
    else if (sort === 'high') r.sort((a, b) => b.price - a.price);
    else if (sort === 'disc') r.sort((a, b) => discOf(b) - discOf(a));
    res({ items: r.slice((page - 1) * size, page * size), hasMore: r.length > page * size });
  }, 450));
}

/* ---------- 2. Store + live badges ---------- */
const store = (() => {
  let s = { tab: 'home', cart: ls.get('cart', []), dealsNew: ls.get('dealsNew', 5), chip: 'all', sub: '', q: '', filters: { sort: 'rec', min: 0, max: 0, disc: false } };
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
  ls.set('cart', s.cart); ls.set('dealsNew', s.dealsNew);
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
  if (tab === 'deals') { store.set({ dealsNew: 0 }); renderDeals(); }
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
const stars = r => `<span class="stars" style="--fill:${(r / 5 * 100).toFixed(0)}%" role="img" aria-label="${r} out of 5"></span>`;
function cardHTML(p) {
  const d = discOf(p);
  return `<li class="card" data-id="${p.id}">
    <div class="relative aspect-square grid place-items-center text-6xl" style="background:${p.bg}">${p.emoji}
      ${d ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sale text-white text-2xs font-semibold">-${d}%</span>` : ''}
    </div>
    <div class="p-2">
      <p class="text-xs leading-4 line-clamp-2 min-h-8">${esc(p.name)}</p>
      <p class="mt-1 flex items-baseline gap-1 flex-wrap"><span class="text-sale font-bold text-sm">KSh ${fmt(p.price)}</span>${p.old ? `<s class="text-mute text-2xs">${fmt(p.old)}</s>` : ''}</p>
      <div class="mt-1 flex items-center justify-between">
        <span class="flex items-center gap-1 text-2xs text-mute">${stars(p.rating)}<span>(${p.reviews})</span></span>
        <button class="icon-btn bg-brand text-white !w-7 !h-7" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart"><svg class="w-4 h-4"><use href="#i-plus"/></svg></button>
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
async function loadPage(reset) {
  if (feed.loading && !reset) return;
  if (reset) { feed.page = 1; feed.hasMore = true; feed.token++; grid.innerHTML = ''; $('#grid-empty').hidden = true; }
  if (!feed.hasMore) return;
  const token = feed.token; feed.loading = true;
  grid.insertAdjacentHTML('beforeend', skeletons(reset ? 6 : 4));
  const { items, hasMore } = await fetchProducts({ ...query(), page: feed.page });
  if (token !== feed.token) return;            // a newer query started: drop this stale answer
  $$('.card[aria-hidden="true"]', grid).forEach(n => n.remove());
  items.forEach(p => feed.items.set(p.id, p));
  grid.insertAdjacentHTML('beforeend', items.map(cardHTML).join(''));
  feed.page++; feed.hasMore = hasMore; feed.loading = false;
  $('#grid-empty').hidden = grid.children.length > 0;
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
  const { items } = await fetchProducts({ sort: 'disc', disc: true, size: 24 });
  items.forEach(p => feed.items.set(p.id, p));
  el.innerHTML = items.map(cardHTML).join(''); el.dataset.loaded = '1';
}

/* ---------- 7. Chips, category view, drawer ---------- */
const CHIPS = [{ id: 'all', name: 'For you' }, ...CATS];
function renderChips() {
  const s = store.get();
  $('#chips').innerHTML = CHIPS.map(c => `<button class="chip" role="tab" data-chip="${c.id}" aria-selected="${c.id === s.chip}">${esc(c.name)}</button>`).join('');
  $('#chips [aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function selectCategory(chip, sub = '') {
  store.set({ chip, sub, q: '' }); $('#search').value = '';
  if (store.get().tab !== 'home') goTab('home'); // goTab keeps history consistent
  refreshGrid();
}
let sideCat = CATS[0].id;
function renderCategoriesView() {
  $('#cat-side').innerHTML = CATS.map(c => `<button class="cat-side" role="tab" data-side="${c.id}" aria-selected="${c.id === sideCat}">${esc(c.name)}</button>`).join('');
  const c = CATS.find(x => x.id === sideCat);
  $('#cat-main').innerHTML = `<button class="tap w-full text-left mb-3 flex items-center justify-between font-semibold" data-cat-all="${c.id}">${esc(c.name)}<span class="text-xs text-brand font-normal">View all &rsaquo;</span></button>
    <ul class="grid grid-cols-3 gap-y-4 gap-x-2">${c.subs.map(sb => `<li><button class="tap w-full flex flex-col items-center gap-1.5" data-cat="${c.id}" data-sub="${esc(sb)}">
      <span class="w-14 h-14 rounded-full grid place-items-center text-2xl" style="background:${BGS[sb.length % BGS.length]}">${c.icon}</span>
      <span class="text-xs text-center leading-4">${esc(sb)}</span></button></li>`).join('')}</ul>`;
}
$('#drawer-cats').innerHTML = CATS.map(c => `<li><button class="tap w-full flex items-center gap-3 px-4 py-3.5 border-b border-line text-left" data-drawer-cat="${c.id}"><span class="text-xl">${c.icon}</span>${esc(c.name)}</button></li>`).join('');

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
const sizePrice = (p, size) => Math.round(p.price * (1 + p.sizes.indexOf(size) * 0.45) / 10) * 10; // mock: bigger packs cost more
function renderQB() {
  const { p } = qb; if (!p) return;
  const price = sizePrice(p, qb.size);
  $('#qb-img').style.background = p.bg; $('#qb-img').textContent = p.emoji;
  $('#qb-name').textContent = p.name; $('#qb-price').textContent = 'KSh ' + fmt(price);
  $('#qb-old').textContent = p.old ? 'KSh ' + fmt(Math.round(price * p.old / p.price / 10) * 10) : '';
  $('#qb-qty').textContent = qb.qty;
  $('#qb-sizes').innerHTML = p.sizes.map(s => `<button class="chip !h-9 !px-4" data-size="${esc(s)}" aria-selected="${s === qb.size}">${esc(s)}</button>`).join('');
}
function openQuickBuy(id) {
  const p = feed.items.get(id); if (!p) return;
  qb.p = p; qb.size = p.sizes[0]; qb.qty = 1; renderQB(); openOverlay('sheet-quickbuy');
}
$('#qb-sizes').addEventListener('click', e => { const b = e.target.closest('[data-size]'); if (b) { qb.size = b.dataset.size; renderQB(); } });
$('#qb-plus').addEventListener('click', () => { qb.qty = Math.min(99, qb.qty + 1); renderQB(); });
$('#qb-minus').addEventListener('click', () => { qb.qty = Math.max(1, qb.qty - 1); renderQB(); });
function addToCart(p, size, qty) {
  const key = p.id + '|' + size, cart = store.get().cart.map(i => ({ ...i })), hit = cart.find(i => i.key === key);
  if (hit) hit.qty += qty; else cart.push({ key, id: p.id, name: p.name, size, qty, price: sizePrice(p, size), emoji: p.emoji, bg: p.bg });
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
    <div class="w-20 h-20 rounded-lg shrink-0 grid place-items-center text-4xl" style="background:${i.bg}">${i.emoji}</div>
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
  const cart = store.get().cart.map(i => i.key === b.dataset.qty ? { ...i, qty: i.qty + +b.dataset.d } : i).filter(i => i.qty > 0);
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
  if ((el = t.closest('[data-add]'))) { const p = feed.items.get(el.dataset.add); if (p) { addToCart(p, p.sizes[0], 1); toast('Added to cart'); } return; }
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

renderCategoriesView(); syncFilterUI(); refreshGrid();
})();
