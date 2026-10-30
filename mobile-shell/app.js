/* Stermont Arcade mobile shell prototype.
   Vanilla JS, no framework. Data is live: products + categories come from Supabase (section 1).
   Sections: 1 data (Supabase) + search  2 store + badges  3 history-backed overlays  4 tabs  5 header scroll
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

/* ---------- 1. Data: live Supabase catalog ----------
   One fetch of every active product row + the category tree (small: ~225 rows). Pack sizes of one product are separate
   rows that share `variant_group`; they are folded into ONE card with a `sizes` list, each size carrying its own price.
   Names come from /product-names.json (the heading each product page shows, rebuilt with the site); if that file is
   missing the plain database name is used. Filtering, sorting and paging then run in memory, so every filter is instant. */
const SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
const api = path => fetch(SB + '/rest/v1/' + path, { headers: { apikey: KEY }, cache: 'no-store' })
  .then(r => { if (!r.ok) throw new Error('Supabase HTTP ' + r.status); return r.json(); });
const ICONS = { 'pest-control-fumigation': '🪳', agrovet: '🌱', 'phones-accessories': '📱', 'tv-audio-video': '📺', appliances: '🍳', 'home-kitchen': '🏠',
  fashion: '👗', shoes: '👟', bags: '👜', 'watches-jewellery': '⌚', 'computers-accessories': '💻', 'health-beauty': '💄', automotive: '🚗', 'baby-products': '🧸', others: '🛍️' };
const BGS = ['#ede9fe', '#fce7f3', '#dcfce7', '#fef3c7', '#e0f2fe', '#ffe4e6', '#f1f5f9'];
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
let CATS = [];      // [{id: top-level slug, name, icon, subs: [sub-category names]}], built from the live data
let PRODUCTS = [];  // one entry per product (pack sizes folded in)

function buildCatalog(rows, cats, names) {
  const byId = new Map(cats.map(c => [c.id, c]));
  const topOf = c => (c && c.parent_id && byId.get(c.parent_id)) || c;
  const groups = new Map();
  rows.forEach(r => { const k = r.variant_group || r.id; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const out = [];
  groups.forEach((rs, key) => {
    const live = rs.filter(r => r.stock > 0);
    if (!live.length) return;                                   // sold out everywhere: not shown in the shell
    const sizes = live.map(r => ({ rowId: r.id, label: r.variant_label || 'Standard', price: Number(r.price), old: Number(r.old_price) > Number(r.price) ? Number(r.old_price) : 0 }))
      .sort((a, b) => a.price - b.price);
    const rep = live[0], c = byId.get(rep.category_id), top = topOf(c); if (!c || !top) return;
    const low = sizes[0], img = (live.map(r => (r.images || [])[0]).find(Boolean)) || '';
    out.push({
      id: key, cat: top.slug, catName: top.name, sub: c.parent_id ? c.name : '', name: (names && names[rep.id]) || rep.name,
      keys: live.map(r => (r.name || '') + ' ' + String(r.slug || '').replace(/-/g, ' ')).join(' '),   // extra words the search can match: every size's database name + page slug
      img, emoji: ICONS[top.slug] || '🛍️', bg: BGS[hashStr(key) % BGS.length],
      price: low.price, old: low.old, sizes, featured: !!rep.featured, rating: 0, reviews: 0   // no ratings exist in the database
    });
  });
  PRODUCTS = out;
  const have = new Set(out.map(p => p.cat)), subHave = new Set(out.filter(p => p.sub).map(p => p.cat + '|' + p.sub));
  CATS = cats.filter(c => !c.parent_id && !c.is_promo && have.has(c.slug)).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map(c => ({ id: c.slug, name: c.name, icon: ICONS[c.slug] || '🛍️',
      subs: cats.filter(s => s.parent_id === c.id && subHave.has(c.slug + '|' + s.name)).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map(s => s.name) }));
}
let catalogP = null;
function loadCatalog() {
  if (!catalogP) {
    catalogP = Promise.all([
      api('products?active=eq.true&select=id,slug,name,category_id,price,old_price,stock,featured,images,unit,variant_group,variant_label&order=created_at.asc'),
      api('categories?select=id,name,slug,parent_id,sort_order,is_promo&order=sort_order.asc,id.asc'),
      fetch('/product-names.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}))
    ]).then(([rows, cats, names]) => buildCatalog(rows, cats, names)).catch(e => { catalogP = null; throw e; });  // a failed load can be retried
  }
  return catalogP;
}
const discOf = p => p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
const sizeOf = (p, label) => p.sizes.find(s => s.label === label) || p.sizes[0];
/* thumbnail markup: the product photo, or the category emoji when there is none (or it fails to load, see the error listener in section 11) */
const thumb = p => p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async" data-emoji="${esc(p.emoji)}" style="width:100%;height:100%;object-fit:contain;background:#fff">` : p.emoji;

/* ---------- 1b. Search ----------
   Runs in memory on the folded products. What it understands:
   - case, punctuation and accents do not matter ("bed-bug", "Bed Bug", "BED BUG"); "5%" and "1.8l" keep their % and .
   - filler words are ignored ("buy", "price", "kenya", "online" ...) because every shown name starts with "Buy"
   - plurals ("killers" finds "killer"), words glued together ("bedbug" finds "bed bug"), and the match looks at the shown name, every size's
     database name, the page slug, the category, the sub-category and the pack sizes (so "1 litre" and "250ml" work)
   - every word must match (AND); results are ranked by relevance (word starts in the name first) unless the customer chose another sort
   - when nothing matches, a typo-tolerant pass runs ("glyphosat", "fungisid", "samsug") and the grid says "Close matches" */
const FILLER = new Set(['buy', 'in', 'kenya', 'price', 'prices', 'online', 'the', 'for', 'and', 'of', 'a', 'best', 'cheap', 'original']);
const normQ = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ')
  .replace(/[^a-z0-9%.]+/g, ' ').split(' ').map(t => t.replace(/^\.+|\.+$/g, '')).filter(Boolean).join(' ');
const queryWords = q => { const all = normQ(q).split(' ').filter(Boolean), keep = all.filter(w => !FILLER.has(w)); return keep.length ? keep : all; };
const variants = w => { const v = [w]; if (w.length > 3 && w.endsWith('s')) v.push(w.slice(0, -1)); if (w.length > 4 && w.endsWith('es')) v.push(w.slice(0, -2)); return v; };
function hayOf(p) {
  if (!p._hay) {
    const name = normQ(p.name);
    const all = normQ([p.name, p.keys, p.catName, p.sub, p.sizes.map(s => s.label).join(' ')].join(' '));
    p._hay = { name, nameTokens: name.split(' '), all, compact: all.replace(/ /g, ''), tokens: [...new Set(all.split(' '))] };
  }
  return p._hay;
}
const hit = (w, h) => variants(w).some(v => h.all.includes(v) || (v.length >= 4 && h.compact.includes(v)));
function lev(a, b, max) {                                       // edit distance, gives up (returns max + 1) once it is clearly above max
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
const fuzzyHit = (w, h) => {
  if (hit(w, h)) return true;
  const t = w.length < 4 ? 0 : w.length < 7 ? 1 : 2; if (!t) return false;   // short words must match exactly; longer ones may have 1 or 2 slips
  return h.tokens.some(tok => lev(w, tok, t) <= t || (tok.length > w.length && lev(w, tok.slice(0, w.length), t) <= t));
};
function scoreOf(p, words) {
  const h = hayOf(p); let s = 0;
  for (const w of words) {
    const vs = variants(w);
    if (vs.some(v => h.nameTokens.some(t => t.startsWith(v)))) s += 4;       // a word of the shown name starts with it
    else if (vs.some(v => h.name.includes(v))) s += 3;
    else if (vs.some(v => h.all.includes(v))) s += 1;
    else s += 0.5;
  }
  if (words.length > 1 && h.name.includes(words.join(' '))) s += 5;           // the whole phrase appears in the name
  if (h.name.startsWith(words[0]) || h.name.startsWith('buy ' + words[0])) s += 2;
  return s;
}

/* Resolves {items, hasMore, total, fuzzy}; rejects when Supabase cannot be reached (the grid shows a retry link). */
async function fetchProducts({ cat = 'all', sub = '', q = '', sort = 'rec', min = 0, max = 0, disc = false, page = 1, size = 12 }) {
  await loadCatalog();
  const words = queryWords(q);
  const base = PRODUCTS.filter(p => (cat === 'all' || p.cat === cat) && (!sub || p.sub === sub) && (!min || p.price >= min) && (!max || p.price <= max) && (!disc || discOf(p) > 0));
  let r = words.length ? base.filter(p => { const h = hayOf(p); return words.every(w => hit(w, h)); }) : base.slice(), fuzzy = false;
  if (words.length && !r.length) { r = base.filter(p => { const h = hayOf(p); return words.every(w => fuzzyHit(w, h)); }); fuzzy = r.length > 0; }
  if (sort === 'low') r.sort((a, b) => a.price - b.price);
  else if (sort === 'high') r.sort((a, b) => b.price - a.price);
  else if (sort === 'disc') r.sort((a, b) => discOf(b) - discOf(a));
  else if (words.length) { const sc = new Map(r.map(p => [p, scoreOf(p, words)])); r.sort((a, b) => sc.get(b) - sc.get(a) || b.featured - a.featured); }   // searching: best match first
  else r.sort((a, b) => b.featured - a.featured);               // recommended: featured first, then the catalog order (sort is stable)
  return { items: r.slice((page - 1) * size, page * size), hasMore: r.length > page * size, total: r.length, fuzzy };
}

/* ---------- 2. Store + live badges ---------- */
const store = (() => {
  let s = { tab: 'home', cart: ls.get('cart', []).filter(i => i.rowId), dealsNew: 0, chip: 'all', sub: '', q: '', filters: { sort: 'rec', min: 0, max: 0, disc: false } };   // dealsNew stays 0 (badge hidden) until the catalog is loaded, see syncDealsBadge
  const subs = new Set();
  return {
    get: () => s,
    set(patch) { const prev = s; s = { ...s, ...patch }; subs.forEach(f => f(s, prev)); },
    subscribe(f) { subs.add(f); f(s, s); }
  };
})();
const cartCount = s => s.cart.reduce((n, i) => n + i.qty, 0);
const cartTotal = s => s.cart.reduce((n, i) => n + i.qty * i.price, 0);

/* Deals badge = discounted products that are new since the last visit to the Deals tab.
   "Discounted" is the same rule as the Deals tab (discOf > 0, lowest size). `shell.dealsSeen` holds the count seen at the last visit. */
let dealsCount = 0;
function syncDealsBadge() {
  dealsCount = PRODUCTS.filter(p => discOf(p) > 0).length;
  const onDeals = store.get().tab === 'deals';
  if (onDeals) ls.set('dealsSeen', dealsCount);
  store.set({ dealsNew: onDeals ? 0 : Math.max(0, dealsCount - ls.get('dealsSeen', 0)) });
}

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
  ls.set('cart', s.cart);
});

/* ---------- 3. Overlays wired to browser history ----------
   Opening pushes a history entry holding the overlay stack; the device Back button (popstate)
   pops it and closes the overlay instead of leaving the page. UI close buttons call history.back()
   so the history stays in sync. Reload or forward into a stale entry never reopens a sheet. */
const OVERLAYS = ['drawer-categories', 'sheet-filters', 'sheet-quickbuy', 'page-product'];
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
  stack = (st.stack || []).filter(id => OVERLAYS.includes(id) && !((id === 'sheet-quickbuy' || id === 'page-product') && !qb.p));
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
  if (tab === 'deals') { ls.set('dealsSeen', dealsCount); store.set({ dealsNew: 0 }); renderDeals(); }
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
  return `<li class="card" data-id="${esc(p.id)}">
    <div class="relative aspect-square grid place-items-center text-6xl" style="background:${p.bg};overflow:hidden">${thumb(p)}
      ${d ? `<span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sale text-white text-2xs font-semibold">-${d}%</span>` : ''}
    </div>
    <div class="p-2">
      <p class="text-xs leading-4 line-clamp-2 min-h-8">${esc(p.name)}</p>
      <p class="mt-1 flex items-baseline gap-1 flex-wrap"><span class="text-sale font-bold text-sm">${p.sizes.length > 1 ? 'From ' : ''}KSh ${fmt(p.price)}</span>${p.old ? `<s class="text-mute text-2xs">${fmt(p.old)}</s>` : ''}</p>
      <div class="mt-1 flex items-center justify-between">
        <span class="flex items-center gap-1 text-2xs text-mute">${p.rating ? `${stars(p.rating)}<span>(${p.reviews})</span>` : p.sizes.length > 1 ? `${p.sizes.length} sizes` : ''}</span>
        <button class="icon-btn bg-brand text-white !w-7 !h-7" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart"><svg class="w-4 h-4"><use href="#i-plus"/></svg></button>
      </div>
    </div></li>`;
}
const SKELETON = `<li class="card pointer-events-none" aria-hidden="true"><div class="skel aspect-square !rounded-none"></div><div class="p-2 space-y-2"><div class="skel h-3 w-full"></div><div class="skel h-3 w-2/3"></div><div class="skel h-4 w-1/2"></div></div></li>`;
const skeletons = n => SKELETON.repeat(n);

const grid = $('#grid'), sentinel = $('#sentinel'), EMPTY_TEXT = $('#grid-empty').textContent;
function showGridError() { const el = $('#grid-empty'); el.innerHTML = 'Could not load products. <button class="underline text-brand" data-retry>Try again</button><br><a class="underline text-brand" href="/classic.html">Open the full shop</a>'; el.hidden = false; }
const noResultsHTML = q => `No results for "${esc(q)}".<br><span class="text-xs">Check the spelling or try a shorter word.</span><br><a class="underline text-brand" target="_blank" rel="noopener" href="https://wa.me/254748888230?text=${encodeURIComponent('Hello Stermont Arcade, do you have: ' + q)}">Ask us on WhatsApp</a> &middot; <button class="underline text-brand" data-clear-search>Clear search</button>`;
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
  let res;
  try { res = await fetchProducts({ ...query(), page: feed.page }); }
  catch (e) {
    if (token !== feed.token) return;
    $$('.card[aria-hidden="true"]', grid).forEach(n => n.remove());
    feed.loading = false; feed.hasMore = false; showGridError(); return;
  }
  if (token !== feed.token) return;            // a newer query started: drop this stale answer
  const { items, hasMore } = res;
  $$('.card[aria-hidden="true"]', grid).forEach(n => n.remove());
  items.forEach(p => feed.items.set(p.id, p));
  grid.insertAdjacentHTML('beforeend', items.map(cardHTML).join(''));
  feed.page++; feed.hasMore = hasMore; feed.loading = false;
  const q = store.get().q;
  if (q) $('#grid-title').textContent = `${res.fuzzy ? 'Close matches for' : 'Results for'} "${q}" (${res.total})`;
  const em = $('#grid-empty');
  if (grid.children.length) em.hidden = true;
  else { if (q) em.innerHTML = noResultsHTML(q); else em.textContent = EMPTY_TEXT; em.hidden = false; }
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
  catch (e) { el.innerHTML = '<li class="text-center text-mute py-10" style="grid-column:1/-1">Could not load deals. <button class="underline text-brand" data-retry-deals>Try again</button></li>'; return; }
  items.forEach(p => feed.items.set(p.id, p));
  el.innerHTML = items.map(cardHTML).join(''); el.dataset.loaded = '1';
}

/* ---------- 7. Chips, category view, drawer ---------- */
function renderChips() {
  const s = store.get(), CHIPS = [{ id: 'all', name: 'For you' }, ...CATS];
  $('#chips').innerHTML = CHIPS.map(c => `<button class="chip" role="tab" data-chip="${esc(c.id)}" aria-selected="${c.id === s.chip}">${esc(c.name)}</button>`).join('');
  $('#chips [aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function selectCategory(chip, sub = '') {
  clearTimeout(searchTimer);
  store.set({ chip, sub, q: '' }); $('#search').value = '';
  if (store.get().tab !== 'home') goTab('home'); // goTab keeps history consistent
  refreshGrid();
}
let sideCat = '__top';
/* Photo for a tile: the first product photo in that category (and sub-category); the emoji shows if there is none or it fails to load. */
const photoOf = (cat, sub) => (PRODUCTS.find(p => p.cat === cat && (!sub || p.sub === sub) && p.img) || {}).img || '';
const tile = (attrs, label, img, emoji, bg) => `<li><button class="tap w-full flex flex-col items-center gap-1.5" ${attrs}>
      <span class="grid place-items-center overflow-hidden rounded-lg text-3xl" style="width:64px;height:64px;background:${bg}">${thumb({ img, emoji })}</span>
      <span class="text-xs text-center leading-4">${esc(label)}</span></button></li>`;
function renderCategoriesView() {
  if (!CATS.length) { $('#cat-side').innerHTML = ''; $('#cat-main').innerHTML = '<p class="text-mute text-sm py-6 text-center">Loading categories&hellip;</p>'; return; }
  const c = sideCat === '__top' ? null : (CATS.find(x => x.id === sideCat) || null);
  sideCat = c ? c.id : '__top';
  const rail = (id, icon, name) => `<button class="cat-side" role="tab" data-side="${esc(id)}" aria-selected="${id === sideCat}" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:14px 4px"><span style="font-size:26px;line-height:1">${icon}</span><span>${esc(name)}</span></button>`;
  $('#cat-side').innerHTML = rail('__top', '⭐', 'Top Categories') + CATS.map(x => rail(x.id, x.icon, x.name)).join('');
  if (!c) {
    $('#cat-main').innerHTML = `<div class="mb-3 font-semibold">Top Categories</div>
      <ul class="grid grid-cols-3 gap-y-4 gap-x-2">${CATS.map(x => tile(`data-cat-all="${esc(x.id)}"`, x.name, photoOf(x.id), x.icon, '#fff')).join('')}</ul>`;
    return;
  }
  $('#cat-main').innerHTML = `<button class="tap w-full text-left mb-3 flex items-center justify-between font-semibold" data-cat-all="${esc(c.id)}">${esc(c.name)}<span class="text-xs text-brand font-normal">View all &rsaquo;</span></button>
    <ul class="grid grid-cols-3 gap-y-4 gap-x-2">${c.subs.length ? c.subs.map(sb => tile(`data-cat="${esc(c.id)}" data-sub="${esc(sb)}"`, sb, photoOf(c.id, sb), c.icon, '#fff')).join('')
      : tile(`data-cat-all="${esc(c.id)}"`, 'All ' + c.name, photoOf(c.id), c.icon, '#fff')}</ul>`;
}
function renderDrawer() {
  $('#drawer-cats').innerHTML = CATS.map(c => `<li><button class="tap w-full flex items-center gap-3 px-4 py-3.5 border-b border-line text-left" data-drawer-cat="${esc(c.id)}"><span class="text-xl">${c.icon}</span>${esc(c.name)}</button></li>`).join('');
}

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
const qb = { p: null, size: '', qty: 1, shown: '' };
function renderQB() {
  const { p } = qb; if (!p) return;
  const sz = sizeOf(p, qb.size);
  $('#qb-img').style.background = p.bg; $('#qb-img').style.overflow = 'hidden'; $('#qb-img').innerHTML = thumb(p);
  $('#qb-name').textContent = p.name; $('#qb-price').textContent = 'KSh ' + fmt(sz.price);
  $('#qb-old').textContent = sz.old ? 'KSh ' + fmt(sz.old) : '';
  $('#qb-qty').textContent = qb.qty;
  $('#qb-sizes').innerHTML = p.sizes.map(s => `<button class="chip !h-9 !px-4" data-size="${esc(s.label)}" aria-selected="${s.label === qb.size}">${esc(s.label)}</button>`).join('');
  if (qb.shown !== sz.rowId) { qb.shown = sz.rowId; renderDetails(sz.rowId); }   // quantity changes do not reload the details
}
/* Details (description, unit, stock, extra photos, page link) are fetched when a product is opened, not with the list: the descriptions are long
   (about 500 words for the agrochemicals), so loading all of them up front would slow the grid. Only named columns are read (never `cost`). */
const details = new Map();
const detailsFor = rowId => { if (!details.has(rowId)) details.set(rowId, api(`products?id=eq.${encodeURIComponent(rowId)}&select=description,unit,stock,low_at,slug,images`).then(r => r[0] || null).catch(() => { details.delete(rowId); return null; })); return details.get(rowId); };
async function renderDetails(rowId) {
  const box = $('#qb-details'); if (!box) return;                  // an older cached index.html has no details block: leave the sheet as it was
  box.hidden = false;
  $('#qb-meta').textContent = ''; $('#qb-desc').textContent = 'Loading details\u2026'; $('#qb-photos').innerHTML = ''; $('#qb-page').hidden = true;
  const d = await detailsFor(rowId);
  if (!qb.p || sizeOf(qb.p, qb.size).rowId !== rowId) return;          // another size or product was chosen meanwhile
  if (!d) { $('#qb-desc').innerHTML = 'Could not load the details. <button class="underline text-brand" data-retry-details>Try again</button>'; return; }
  const left = Number(d.stock), low = Number(d.low_at) || 5;
  $('#qb-meta').textContent = [d.unit ? 'Unit: ' + d.unit : '', left > 0 ? (left <= low ? 'Only ' + left + ' left' : 'In stock') : 'Out of stock'].filter(Boolean).join(' \u00b7 ');
  $('#qb-desc').textContent = (d.description || '').trim() || 'No description yet. Ask us on WhatsApp for more details.';
  const imgs = (d.images || []).filter(Boolean);
  $('#qb-photos').innerHTML = imgs.length > 1 ? imgs.map(u => `<button class="shrink-0" data-photo="${esc(u)}" aria-label="Show photo" style="width:56px;height:56px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff">${thumb({ img: u, emoji: qb.p.emoji })}</button>`).join('') : '';
  if (d.slug) { $('#qb-page').href = '/p/' + encodeURIComponent(d.slug) + '.html'; $('#qb-page').hidden = false; }
}
document.addEventListener('click', e => {
  const ph = e.target.closest('[data-photo]');
  if (ph && qb.p) { $('#qb-img').innerHTML = thumb({ img: ph.dataset.photo, emoji: qb.p.emoji }); return; }
  if (e.target.closest('[data-retry-details]') && qb.p) { const id = sizeOf(qb.p, qb.size).rowId; renderDetails(id); }
});
/* ---------- 9b. Product page: the full product view, inside the shell (replaces the link to the old /p/ page) ----------
   It shares the selection (product, size, quantity) with the quick-buy sheet, so both always agree. Opening it pushes one history entry,
   so Back returns to the sheet / list the customer came from. The generated /p/<slug>.html pages stay as they are for Google. */
const pp = { img: '' };
async function renderPP() {
  const p = qb.p; if (!p) return;
  const sz = sizeOf(p, qb.size), off = sz.old ? Math.round((1 - sz.price / sz.old) * 100) : 0, rowId = sz.rowId;
  $('#pp-title').textContent = p.name; $('#pp-name').textContent = p.name;
  $('#pp-img').style.background = '#fff'; $('#pp-img').innerHTML = thumb({ img: pp.img || p.img, emoji: p.emoji });
  $('#pp-price').textContent = 'KSh ' + fmt(sz.price); $('#pp-old').textContent = sz.old ? 'KSh ' + fmt(sz.old) : ''; $('#pp-off').textContent = off ? '-' + off + '%' : '';
  $('#pp-qty').textContent = qb.qty;
  $('#pp-sizes').innerHTML = p.sizes.map(x => `<button class="chip !h-9 !px-4" data-pp-size="${esc(x.label)}" aria-selected="${x.label === qb.size}">${esc(x.label)}</button>`).join('');
  const rel = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).sort((a, b) => (b.sub === p.sub) - (a.sub === p.sub)).slice(0, 8);
  $('#pp-related-wrap').hidden = !rel.length;
  $('#pp-related').innerHTML = rel.map(x => `<button class="tap" data-pp-open="${esc(x.id)}" style="flex:none;width:112px;text-align:left"><span class="grid place-items-center overflow-hidden rounded-lg text-3xl" style="width:112px;height:112px;background:#fff;border:1px solid #e5e7eb">${thumb(x)}</span><span class="line-clamp-2 text-xs" style="display:block;margin-top:4px">${esc(x.name)}</span><span class="text-xs font-bold text-sale">KSh ${fmt(x.price)}</span></button>`).join('');
  $('#pp-desc').textContent = 'Loading details\u2026'; $('#pp-meta').textContent = ''; $('#pp-photos').innerHTML = '';
  const d = await detailsFor(rowId);
  if (!qb.p || sizeOf(qb.p, qb.size).rowId !== rowId) return;
  if (!d) { $('#pp-desc').innerHTML = 'Could not load the details. <button class="underline text-brand" data-pp-retry>Try again</button>'; return; }
  const left = Number(d.stock), low = Number(d.low_at) || 5;
  $('#pp-meta').textContent = [d.unit ? 'Unit: ' + d.unit : '', left > 0 ? (left <= low ? 'Only ' + left + ' left' : 'In stock') : 'Out of stock'].filter(Boolean).join(' \u00b7 ');
  $('#pp-desc').textContent = (d.description || '').trim() || 'No description yet. Ask us on WhatsApp for more details.';
  const imgs = (d.images || []).filter(Boolean);
  if (!pp.img && imgs[0]) $('#pp-img').innerHTML = thumb({ img: imgs[0], emoji: p.emoji });
  $('#pp-photos').innerHTML = imgs.length > 1 ? imgs.map(u => `<button class="shrink-0" data-pp-photo="${esc(u)}" aria-label="Show photo" style="width:56px;height:56px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff">${thumb({ img: u, emoji: p.emoji })}</button>`).join('') : '';
}
function openProductPage() { if (!qb.p) return; pp.img = ''; renderPP(); $('#pp-body').scrollTop = 0; openOverlay('page-product'); }
$('#qb-page').addEventListener('click', e => { e.preventDefault(); openProductPage(); });   // the href stays as a fallback (new tab / no script)
document.addEventListener('click', e => {
  const t = e.target; let el;
  if ((el = t.closest('[data-pp-size]'))) { qb.size = el.dataset.ppSize; pp.img = ''; renderPP(); renderQB(); return; }
  if ((el = t.closest('[data-pp-photo]'))) { pp.img = el.dataset.ppPhoto; $('#pp-img').innerHTML = thumb({ img: pp.img, emoji: qb.p.emoji }); return; }
  if ((el = t.closest('[data-pp-open]'))) { const x = PRODUCTS.find(y => y.id === el.dataset.ppOpen); if (!x) return; qb.p = x; qb.size = x.sizes[0].label; qb.qty = 1; qb.shown = ''; pp.img = ''; renderPP(); renderQB(); $('#pp-body').scrollTop = 0; return; }
  if (t.closest('[data-pp-retry]')) return renderPP();
  if (t.closest('[data-pp-cart]')) return closeAllThen(() => goTab('cart'));
});
$('#pp-plus').addEventListener('click', () => { qb.qty = Math.min(99, qb.qty + 1); renderPP(); renderQB(); });
$('#pp-minus').addEventListener('click', () => { qb.qty = Math.max(1, qb.qty - 1); renderPP(); renderQB(); });
$('#pp-add').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); toast('Added to cart'); });
$('#pp-buy').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); closeAllThen(() => goTab('cart')); });

function openQuickBuy(id) {
  const p = feed.items.get(id); if (!p) return;
  qb.p = p; qb.size = p.sizes[0].label; qb.qty = 1; qb.shown = ''; renderQB(); openOverlay('sheet-quickbuy');
}
$('#qb-sizes').addEventListener('click', e => { const b = e.target.closest('[data-size]'); if (b) { qb.size = b.dataset.size; renderQB(); } });
$('#qb-plus').addEventListener('click', () => { qb.qty = Math.min(99, qb.qty + 1); renderQB(); });
$('#qb-minus').addEventListener('click', () => { qb.qty = Math.max(1, qb.qty - 1); renderQB(); });
function addToCart(p, size, qty) {
  const sz = sizeOf(p, size), key = p.id + '|' + sz.label, cart = store.get().cart.map(i => ({ ...i })), hit = cart.find(i => i.key === key);
  if (hit) hit.qty += qty; else cart.push({ key, id: p.id, rowId: sz.rowId, name: p.name, size: sz.label, qty, price: sz.price, img: p.img, emoji: p.emoji, bg: p.bg });
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
    <div class="w-20 h-20 rounded-lg shrink-0 grid place-items-center text-4xl" style="background:${i.bg};overflow:hidden">${thumb(i)}</div>
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
/* Checkout: the shop's own checkout (M-Pesa, delivery fees, order e-mails) lives on /classic.html. The cart lines are handed over
   under `stm_handoff`; that page adds them through its STM.add once its product cards exist, then opens its cart. */
$('#checkout').addEventListener('click', () => {
  const cart = store.get().cart; if (!cart.length) return;
  try { localStorage.setItem('stm_handoff', JSON.stringify(cart.map(i => ({ rowId: i.rowId, qty: i.qty, price: i.price, name: i.name, size: i.size })))); }
  catch { toast('Could not start checkout. Please allow site storage and try again.'); return; }
  location.href = '/classic.html?checkout=1';   // the shell cart stays until the order is finished (classic.html clears it) so a cancelled checkout loses nothing
});

/* ---------- 11. Wiring ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.style.opacity = 1;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.opacity = 0, 1600);
}
document.addEventListener('click', e => {
  const t = e.target;
  let el;
  if (t.closest('[data-clear-search]')) { $('#search').value = ''; return runSearch('', { force: true, go: false }); }
  if ((el = t.closest('[data-tab]'))) return goTab(el.dataset.tab);
  if ((el = t.closest('[data-open]'))) { opener = el; if (el.dataset.open === 'sheet-filters') { draftSort = store.get().filters.sort; syncFilterUI(); } return openOverlay(el.dataset.open); }
  if ((el = t.closest('[data-close]'))) return closeTop();
  if ((el = t.closest('[data-add]'))) { const p = feed.items.get(el.dataset.add); if (p) { if (p.sizes.length > 1) openQuickBuy(p.id); else { addToCart(p, p.sizes[0].label, 1); toast('Added to cart'); } } return; }   // several pack sizes: pick the size first
  if (t.closest('[data-retry]')) return refreshGrid();
  if (t.closest('[data-retry-deals]')) return renderDeals();
  if ((el = t.closest('#chips [data-chip]'))) return selectCategory(el.dataset.chip);
  if ((el = t.closest('[data-side]'))) { sideCat = el.dataset.side; return renderCategoriesView(); }
  if ((el = t.closest('[data-cat-all]'))) return selectCategory(el.dataset.catAll);
  if ((el = t.closest('[data-cat]'))) return selectCategory(el.dataset.cat, el.dataset.sub);
  if ((el = t.closest('[data-drawer-cat]'))) { const id = el.dataset.drawerCat; return closeAllThen(() => selectCategory(id)); }
  if ((el = t.closest('.card[data-id]'))) return openQuickBuy(el.dataset.id);
});
document.addEventListener('error', e => { const i = e.target; if (i && i.tagName === 'IMG' && i.dataset.emoji) i.replaceWith(document.createTextNode(i.dataset.emoji)); }, true); // photo failed: show the category emoji

/* Search box: results update while typing (after a short pause) and on Enter / the keyboard's search key. Every new search starts at the top of
   the results (the list used to keep its old scroll position, which showed the page footer instead of the first result), and a search from another
   tab switches to Home. Emptying the box (or the clear "x") brings back the normal list. */
let searchTimer = 0;
function runSearch(raw, { force = false, go = true } = {}) {
  const q = String(raw || '').trim().replace(/\s+/g, ' '), s = store.get();
  if (!force && q === s.q && s.chip === 'all' && !s.sub) return;          // nothing changed (e.g. typing a space)
  store.set({ q, chip: 'all', sub: '' });
  scrollPos.home = 0;                                                      // showTab('home') would otherwise restore the old scroll position
  if (go && store.get().tab !== 'home') goTab('home'); else window.scrollTo(0, 0);
  refreshGrid();
}
$('#search').addEventListener('input', e => {
  if (e.isComposing) return;
  clearTimeout(searchTimer);
  const v = $('#search').value.trim();
  if (v.length === 1) return;                                              // one letter matches almost everything: wait for the second
  searchTimer = setTimeout(() => runSearch(v, { go: v.length > 0 }), 280);
});
$('#search-form').addEventListener('submit', e => {
  e.preventDefault(); clearTimeout(searchTimer); $('#search').blur();
  runSearch($('#search').value, { force: true });
});

syncFilterUI(); renderCategoriesView(); renderDrawer(); refreshGrid();
loadCatalog().then(() => { renderChips(); renderCategoriesView(); renderDrawer(); syncDealsBadge(); }).catch(() => {});   // categories and the Deals badge appear once the data is in
})();
