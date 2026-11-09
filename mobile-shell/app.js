/* Stermont Arcade mobile shell prototype.
   Vanilla JS, no framework. Data is live: products + categories come from Supabase (section 1).
   Sections: 1 data (Supabase)  2 store + badges  3 history-backed overlays  4 tabs  5 header scroll
             6 grid + skeletons  7 categories  8 filters  9 quick buy  10 cart  11 wiring */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $ = (s, r = document) => [...r.querySelectorAll(s)];
// Defer product-card image requests until they are close to the viewport.
// Native loading="lazy" can fetch images far below the fold on mobile; this observer
// keeps the initial homepage/category transfer smaller while preserving real photos.
const productImageObserver = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      productImageObserver.unobserve(img);
    }), { rootMargin: '160px 0px' })
  : null;
const watchProductImages = root => {
  const imgs = [...(root.matches?.('img[data-src]') ? [root] : []), ...(root.querySelectorAll ? root.querySelectorAll('img[data-src]') : [])];
  imgs.forEach(img => {
    if (productImageObserver) productImageObserver.observe(img);
    else { img.src = img.dataset.src; delete img.dataset.src; }
  });
};
if (typeof MutationObserver === 'function' && document.documentElement) {
  const productImageDomObserver = new MutationObserver(records => records.forEach(record => {
    record.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (node.matches?.('img[data-src]') && productImageObserver) productImageObserver.observe(node);
        watchProductImages(node);
      }
    });
  }));
  productImageDomObserver.observe(document.documentElement, { childList: true, subtree: true });
}
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
  fashion: '👗', shoes: '👟', bags: '👜', 'watches-jewellery': '⌚', 'computers-accessories': '💻', 'health-beauty': '💄', automotive: '🚗', 'stermont-cars-for-sale': '🚗', 'baby-products': '🧸', others: '🛍️' };
const BGS = ['#ede9fe', '#fce7f3', '#dcfce7', '#fef3c7', '#e0f2fe', '#ffe4e6', '#f1f5f9'];
const hashStr = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
let CATS = [];      // [{id: top-level slug, name, icon, subs: [sub-category names]}], built from the live data
let CATROWS = [];   // every category row (top-level and sub), to resolve a /?cat=<slug> address
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
    const sizes = live.map(r => ({ rowId: r.id, slug: r.slug, label: r.variant_label || 'Standard', price: Number(r.price), old: Number(r.old_price) > Number(r.price) ? Number(r.old_price) : 0 }))
      .sort((a, b) => a.price - b.price);
    const rep = live[0], c = byId.get(rep.category_id), top = topOf(c); if (!c || !top) return;
    // The lightweight public catalogue RPC returns only each row's lead photo; full galleries load on product open.
    const photos = [...new Set(live.map(r => r.cover_image).filter(u => typeof u === 'string' && u.trim()))];
    const low = sizes[0], img = photos[0] || '';
    out.push({
      id: key, slug: rep.slug, cat: top.slug, catName: top.name, sub: c.parent_id ? c.name : '', name: (names && names[rep.id]) || rep.name,
      img, photos, emoji: ICONS[top.slug] || '🛍️', bg: BGS[hashStr(key) % BGS.length],
      price: low.price, old: low.old, sizes, featured: !!rep.featured, rating: 0, reviews: 0   // no ratings exist in the database
    });
  });
  PRODUCTS = out; CATROWS = cats;
  const have = new Set(out.map(p => p.cat)), subHave = new Set(out.filter(p => p.sub).map(p => p.cat + '|' + p.sub));
  CATS = cats.filter(c => !c.parent_id && !c.is_promo && have.has(c.slug)).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map(c => ({ id: c.slug, name: c.name, icon: ICONS[c.slug] || '🛍️',
      subs: cats.filter(s => s.parent_id === c.id && subHave.has(c.slug + '|' + s.name)).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map(s => s.name) }));
}
let catalogP = null;
let fullCatalog = false;   // true once the WHOLE catalog is in PRODUCTS (the product link fast path in section 9b must never overwrite it)
function loadCatalog() {
  if (!catalogP) {
    catalogP = Promise.all([
      api('rpc/get_store_catalog'),
      api('categories?select=id,name,slug,parent_id,sort_order,is_promo&order=sort_order.asc,id.asc'),
      fetch('/product-names.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({}))
    ]).then(([rows, cats, names]) => { buildCatalog(rows, cats, names); fullCatalog = true; }).catch(e => { catalogP = null; throw e; });  // a failed load can be retried
  }
  return catalogP;
}
const discOf = p => p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
const sizeOf = (p, label) => p.sizes.find(s => s.label === label) || p.sizes[0];
/* Product images never fall back to emoji. If a lead photo fails, try the next genuine gallery photo before showing a neutral unavailable-photo label. */
const thumb = (p, eager = false) => {
  const photos = [...new Set([p.img, ...(Array.isArray(p.photos) ? p.photos : [])].filter(u => typeof u === 'string' && u.trim()))];
  if (!photos.length) return '<span class="photo-unavailable" role="img" aria-label="Product photo unavailable" style="display:grid;place-items:center;width:100%;height:100%;padding:8px;color:#64748b;background:#f8fafc;font:12px/1.4 system-ui;text-align:center">Photo unavailable</span>';
  const source = eager ? `src="${esc(photos[0])}" fetchpriority="high" loading="eager"` : `data-src="${esc(photos[0])}" loading="lazy"`;
  return `<img ${source} alt="${esc(p.name)} product photo" decoding="async" data-fallbacks="${esc(JSON.stringify(photos.slice(1)))}" style="width:100%;height:100%;object-fit:contain;background:#fff">`;
};

/* Resolves {items, hasMore}; rejects when Supabase cannot be reached (the grid shows a retry link). */
// Keep the first mobile product batch small; infinite scroll fetches more only as the shopper approaches the list end.
async function fetchProducts({ cat = 'all', sub = '', q = '', sort = 'rec', min = 0, max = 0, disc = false, page = 1, size = 8 }) {
  await loadCatalog();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const r = PRODUCTS.filter(p => (cat === 'all' || p.cat === cat) && (!sub || p.sub === sub) && (!min || p.price >= min) && (!max || p.price <= max) && (!disc || discOf(p) > 0) &&
    (!words.length || words.every(w => (p.name + ' ' + p.catName + ' ' + p.sub).toLowerCase().includes(w))));
  if (sort === 'low') r.sort((a, b) => a.price - b.price);
  else if (sort === 'high') r.sort((a, b) => b.price - a.price);
  else if (sort === 'disc') r.sort((a, b) => discOf(b) - discOf(a));
  else r.sort((a, b) => b.featured - a.featured);               // recommended: featured first, then the catalog order (sort is stable)
  return { items: r.slice((page - 1) * size, page * size), hasMore: r.length > page * size };
}

/* The category the customer picked (and its sub-category) survives a reload: it is kept for this tab in sessionStorage, like the active tab. Read here, before
   the store below saves its default state, and applied in section 11 once nothing deeper (product / category / search / cart link) was asked for in the address. */
const SAVED_CAT = (() => { try { const c = JSON.parse(sessionStorage.getItem('shell.activeCat') || 'null'); return c && typeof c.chip === 'string' && c.chip !== 'all' ? { chip: c.chip, sub: typeof c.sub === 'string' ? c.sub : '' } : null; } catch { return null; } })();

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
  if (s !== prev) { try { sessionStorage.setItem('shell.activeCat', JSON.stringify({ chip: s.chip, sub: s.sub })); } catch {} }   // keeps the chosen category across a reload
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
/* A product has its own address: /?product=<slug of the chosen size>. The shell is one page, so without this the address bar stayed on the bare
   domain and a product could not be copied, shared or reopened. The base entry under it stays "/", so Back returns to the list. */
const BASE_TITLE = document.title;
const PRODUCT_OVERLAYS = ['sheet-quickbuy', 'page-product'];
/* The address is the product's own CLEAN page address, /p/<slug>.html (+ "#<size slug>" when the chosen size is not the page's own), with no query string:
   a copied or shared link then previews as this product, from that page's head, and a phone that opens it goes straight into this same product view inside
   the shell (the inline script at the top of the page head, seo-shell-chrome.mjs, and shell-chrome.js send /p/<slug>.html to /?product=<slug>).
   Crawlers get the static page, whose canonical is this same clean address. Older links that still end in ?shell=1 keep working (same two scripts). */
const productUrl = () => { if (!qb.p) return undefined; const z = sizeOf(qb.p, qb.size).slug || qb.p.slug; return '/p/' + encodeURIComponent(qb.p.slug) + '.html' + (z !== qb.p.slug ? '#' + encodeURIComponent(z) : ''); };
/* A category has its own address too (owner 2026-11-09: "when I tap on categories, make a direct link"): /c/<slug>.html, the clean address of the generated category page
   (a sub-category uses its own slug). A copied or shared link previews as that category, and a phone that opens it goes straight back into the same category in the shell
   (the inline script of seo-shell-chrome.mjs sends /c/<slug>.html to /?cat=<slug>, handled by openCatLink in section 9b). The address only changes in place (replaceState):
   no history entry is added, so Back behaves exactly as before. It is "/" again on "For you", on search results and on every other tab.
   To undo: make catUrl return '/' and remove the #cat-share button from index.html. */
const catSlugOf = (chip, sub) => {   // slug of the open category or sub-category; '' for "For you"
  if (!chip || chip === 'all') return '';
  if (sub) { const top = CATROWS.find(x => !x.parent_id && x.slug === chip), s = top && CATROWS.find(x => x.parent_id === top.id && x.name === sub); if (s) return s.slug; }
  return chip;
};
const catUrl = () => { const s = store.get(), z = s.tab === 'home' && !s.q ? catSlugOf(s.chip, s.sub) : ''; return z && /^[A-Za-z0-9._~-]+$/.test(z) ? '/c/' + z + '.html' : '/'; };
const catTitle = () => { const s = store.get(), z = catUrl() !== '/' ? (s.sub || (CATS.find(c => c.id === s.chip) || {}).name) : ''; return z ? z + ' | Stermont Arcade' : BASE_TITLE; };
function syncProductMeta() {   // tab title + address follow the open product (and the chosen size), else the open category; both return to normal when nothing is open
  const open = qb.p && stack.some(id => PRODUCT_OVERLAYS.includes(id));
  const cu = catUrl(), share = $('#cat-share');
  if (share) share.style.display = cu === '/' ? 'none' : '';   // the share-link button next to the grid title only shows inside a category
  document.title = open ? qb.p.name + ' | Stermont Arcade' : catTitle();
  if (open) { const u = productUrl(); if (u && location.pathname + location.search + location.hash !== u) history.replaceState(history.state, '', u); }
  else if (cu !== '/') { if (location.pathname + location.search + location.hash !== cu) history.replaceState(history.state, '', cu); }
  else if (/^\/c\/[^/]+\.html$/.test(location.pathname)) history.replaceState(history.state, '', '/');   // only an address this code set is reset: other parameters (campaign tags) stay
}
function openOverlay(id) {
  if (stack.includes(id)) return;
  stack.push(id);
  history.pushState({ tab: store.get().tab, stack: [...stack] }, '', PRODUCT_OVERLAYS.includes(id) ? productUrl() : undefined);
  syncOverlays(); syncProductMeta();
  const el = $('#' + id); const f = el.querySelector('button,input'); if (f) f.focus({ preventScroll: true });
}
const closeTop = () => { if (stack.length) history.back(); };
function closeAllThen(fn) { // close every overlay, then run fn once history has settled
  if (!stack.length) return fn();
  afterClose = fn; history.go(-stack.length);
}
window.addEventListener('popstate', e => {
  if (typeof coFrame !== 'undefined' && coFrame && !(e.state && e.state.checkout)) closeCheckout(true);   // Back while the checkout layer is open
  const st = e.state || { tab: 'home', stack: [] };
  stack = (st.stack || []).filter(id => OVERLAYS.includes(id) && !((id === 'sheet-quickbuy' || id === 'page-product') && !qb.p));
  if (st.tab && st.tab !== store.get().tab) showTab(st.tab);
  syncOverlays(); syncProductMeta();
  if (!stack.length && opener) { opener.focus?.({ preventScroll: true }); opener = null; }
  if (afterClose && !stack.length) { const f = afterClose; afterClose = null; f(); }
});
const DEEP = new URLSearchParams(location.search).get('product');   // /?product=<slug>: a shared or reloaded product address, opened after the catalog loads
let deepOpen = false;   // the product page for DEEP has been opened (by the fast path in section 9b, or after the full catalog)
/* /?cart=<product id>:<qty>,<product id>:<qty>: a shared cart link (the Share cart link button). The cart itself lives in each phone's own storage, so the link
   carries the lines. They are kept in sessionStorage until the catalog has added them, so a reload before that does not lose them. */
const CART_DEEP = (() => {
  const parse = raw => String(raw || '').split(',').slice(0, 40).map(x => { const [id, q] = x.split(':'); return { rowId: (id || '').trim(), qty: Math.max(1, Math.min(99, parseInt(q, 10) || 1)) }; })
    .filter(l => /^[a-z0-9][a-z0-9-]{0,120}$/i.test(l.rowId));
  const fromUrl = parse(new URLSearchParams(location.search).get('cart'));
  try {
    if (fromUrl.length) { sessionStorage.setItem('shell.pendingCart', JSON.stringify(fromUrl)); return fromUrl; }
    return parse((JSON.parse(sessionStorage.getItem('shell.pendingCart') || '[]') || []).map(l => l.rowId + ':' + l.qty).join(','));
  } catch { return fromUrl; }
})();
const TAB_DEEP = CART_DEEP.length ? 'cart' : new URLSearchParams(location.search).get('tab');   // /?tab=cart|categories|deals|account: the bottom nav of the static pages (shell-chrome.js); a shared cart link opens the cart
const Q_DEEP = (new URLSearchParams(location.search).get('q') || '').trim().slice(0, 80);   // /?q=<words>: the search box of the static pages
const CAT_DEEP = new URLSearchParams(location.search).get('cat');   // /?cat=<slug>: a category (or sub-category) page address; /c/<slug>.html sends phones here
/* A reload keeps the tab the customer was on: the browser hands back the state of the current history entry, and every tab hop stores its tab in it
   (goTab). The first view is Home only for a fresh visit or an unknown tab. The tab is shown at the very end of this file, once the views exist. */
const TABS = ['home', 'categories', 'deals', 'cart', 'account'];
const SAVED_TAB = (() => { try { const t = sessionStorage.getItem('shell.activeTab'); return TABS.includes(t) ? t : null; } catch { return null; } })();
const START_TAB = (!DEEP && history.state && TABS.includes(history.state.tab)) ? history.state.tab
  : (!DEEP && !CAT_DEEP && !Q_DEEP && TABS.includes(TAB_DEEP)) ? TAB_DEEP
  : (!DEEP && !CAT_DEEP && !Q_DEEP && SAVED_TAB) ? SAVED_TAB : 'home';
history.replaceState({ tab: START_TAB, stack: [] }, '', (DEEP || CAT_DEEP || TAB_DEEP || Q_DEEP) ? location.pathname : undefined); // a reload lands on a clean base entry (no sheet), on the same tab
scrim.addEventListener('click', closeTop);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTop(); });
syncOverlays();

/* ---------- 4. Tabs / bottom nav ---------- */
const scrollPos = {};
function showTab(tab) {
  const prev = store.get().tab;
  scrollPos[prev] = window.scrollY;
  try { sessionStorage.setItem('shell.activeTab', tab); } catch {}
  store.set({ tab });
  $$('[data-view]').forEach(v => v.hidden = v.dataset.view !== tab);
  $$('#bottom-nav .nav-item').forEach(b => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#chips-wrap').hidden = tab !== 'home';
  $('#appbar').classList.remove('is-compact');
  if (tab === 'deals') { if (dealsCount) ls.set('dealsSeen', dealsCount); store.set({ dealsNew: 0 }); renderDeals(); }   // dealsCount is 0 until the catalog is in (a reload on Deals): syncDealsBadge saves it then
  syncProductMeta();   // the category address belongs to the Home tab only
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
const SKELETON = `<li class="card pointer-events-none" aria-hidden="true"><div class="skel aspect-square !rounded-none"></div><div class="p-2 space-y-2"><div class="skel h-8 w-full"></div><div class="skel h-4 w-1/2"></div><div class="flex items-center justify-between"><div class="skel h-3 w-1/2"></div><div class="skel h-7 w-7 rounded-full"></div></div></div></li>`;
const skeletons = n => SKELETON.repeat(n);

const grid = $('#grid'), sentinel = $('#sentinel'), EMPTY_TEXT = $('#grid-empty').textContent;
function showGridError() { const el = $('#grid-empty'); el.innerHTML = 'Could not load products. <button class="underline text-brand" data-retry>Try again</button><br><a class="underline text-brand" href="/">Reload the shell</a>'; el.hidden = false; }
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
  const em = $('#grid-empty'); em.textContent = EMPTY_TEXT; em.hidden = grid.children.length > 0;
  if (feed.hasMore && store.get().tab === 'home' && sentinel.getBoundingClientRect().top < innerHeight + 400) loadPage(false);
}
new IntersectionObserver(es => { if (es[0].isIntersecting && store.get().tab === 'home') loadPage(false); }, { rootMargin: '400px' }).observe(sentinel);

function refreshGrid() {
  const s = store.get(), cat = CATS.find(c => c.id === s.chip);
  $('#grid-title').textContent = s.q ? `Results for "${s.q}"` : s.sub || (cat ? cat.name : 'Recommended for you');
  renderChips(); loadPage(true); syncProductMeta();   // the address bar follows the open category (see catUrl)
}
async function renderDeals() {
  const el = $('#deals-grid'); if (el.dataset.loaded) return;
  el.innerHTML = skeletons(6);
  let items;
  try { ({ items } = await fetchProducts({ sort: 'disc', disc: true, size: 12 })); }
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
  store.set({ chip, sub, q: '' }); $('#search').value = '';
  if (store.get().tab !== 'home') goTab('home'); // goTab keeps history consistent
  refreshGrid();
}
let sideCat = '__top';
/* Photo for a tile: the first product photo in that category (and sub-category); the emoji shows if there is none or it fails to load. */
const SERVICE_TILE_PHOTO = 'https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/service-media/pest-control-fumigation-nairobi/2026-11/mvzjhdh3-7c9e80602774.jpg';
const photoOf = (cat, sub) => (PRODUCTS.find(p => p.cat === cat && (!sub || p.sub === sub) && p.img) || {}).img || '';
const tile = (attrs, label, img, emoji, bg) => `<li><button class="tap w-full flex flex-col items-center gap-1.5" ${attrs}>
      <span class="grid place-items-center overflow-hidden rounded-lg text-3xl" style="width:64px;height:64px;background:${bg}">${img ? thumb({ img, emoji }) : esc(emoji || '')}</span>
      <span class="text-xs text-center leading-4">${esc(label)}</span></button></li>`;
function renderCategoriesView() {
  if (!CATS.length) { $('#cat-side').innerHTML = ''; $('#cat-main').innerHTML = '<p class="text-mute text-sm py-6 text-center">Loading categories&hellip;</p>'; return; }
  const c = sideCat === '__top' ? null : (CATS.find(x => x.id === sideCat) || null);
  sideCat = c ? c.id : '__top';
  /* Rail icon: a real product photo of that category (emoji if none or it fails to load); Top Categories keeps its star. */
  const railIcon = (icon, img) => img ? `<span class="grid place-items-center overflow-hidden rounded-lg shrink-0" style="width:44px;height:44px;font-size:24px;line-height:1;background:#fff;border:1px solid #eee">${thumb({ img, emoji: icon })}</span>` : `<span style="font-size:26px;line-height:1">${icon}</span>`;
  const rail = (id, icon, name, img) => `<button class="cat-side" role="tab" data-side="${esc(id)}" aria-selected="${id === sideCat}" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:14px 4px">${railIcon(icon, img)}<span>${esc(name)}</span></button>`;
  const svcRail = `<a class="cat-side" href="/services/" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:14px 4px;text-decoration:none;color:inherit"><span class="grid place-items-center overflow-hidden rounded-lg shrink-0" style="width:44px;height:44px;font-size:24px;line-height:1;background:#fff;border:1px solid #eee">${thumb({ img: SERVICE_TILE_PHOTO, emoji: '\u{1F6E0}\uFE0F' })}</span><span>Services</span></a>`;
  $('#cat-side').innerHTML = rail('__top', '⭐', 'Top Categories') + svcRail + CATS.map(x => rail(x.id, x.icon, x.name, photoOf(x.id))).join('');
  if (!c) {
    $('#cat-main').innerHTML = `<div class="mb-3 font-semibold">Top Categories</div>
      <ul class="grid grid-cols-3 gap-y-4 gap-x-2"><li><a class="tap w-full flex flex-col items-center gap-1.5" href="/services/" style="text-decoration:none;color:inherit"><span class="grid place-items-center overflow-hidden rounded-lg text-3xl" style="width:64px;height:64px;background:#f3ecff">${thumb({ img: SERVICE_TILE_PHOTO, emoji: '\u{1F6E0}\uFE0F' })}</span><span class="text-xs text-center leading-4">Services</span></a></li>${CATS.map(x => tile(`data-cat-all="${esc(x.id)}"`, x.name, photoOf(x.id), x.icon, '#fff')).join('')}</ul>`;
    return;
  }
  $('#cat-main').innerHTML = `<button class="tap w-full text-left mb-3 flex items-center justify-between font-semibold" data-cat-all="${esc(c.id)}">${esc(c.name)}<span class="text-xs text-brand font-normal">View all &rsaquo;</span></button>
    <ul class="grid grid-cols-3 gap-y-4 gap-x-2">${c.subs.length ? c.subs.map(sb => tile(`data-cat="${esc(c.id)}" data-sub="${esc(sb)}"`, sb, photoOf(c.id, sb), c.icon, '#fff')).join('')
      : tile(`data-cat-all="${esc(c.id)}"`, 'All ' + c.name, photoOf(c.id), c.icon, '#fff')}</ul>`;
}
function renderDrawer() {
  const svc = `<li><a href="/services/" class="tap w-full flex items-center gap-3 px-4 py-3.5 border-b border-line text-left font-semibold text-brand"><span class="text-xl">\u{1F6E0}\uFE0F</span>Services<span class="ml-auto text-xs font-normal">Pest control, CCTV, solar &rsaquo;</span></a></li>`;
  /* Each category shows a real product photo from the shop (first product with a photo in it); the emoji shows if there is none or it fails to load. */
  $('#drawer-cats').innerHTML = svc + CATS.map(c => `<li><button class="tap w-full flex items-center gap-3 px-4 py-2.5 border-b border-line text-left" data-drawer-cat="${esc(c.id)}"><span class="grid place-items-center overflow-hidden rounded-lg text-xl shrink-0" style="width:44px;height:44px;background:#fff;border:1px solid #eee">${thumb({ img: photoOf(c.id), emoji: c.icon })}</span>${esc(c.name)}</button></li>`).join('');
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
  $('#qb-img').style.background = p.bg; $('#qb-img').style.overflow = 'hidden'; $('#qb-img').innerHTML = thumb(p, true);
  $('#qb-name').textContent = p.name; $('#qb-price').textContent = 'KSh ' + fmt(sz.price);
  $('#qb-old').textContent = sz.old ? 'KSh ' + fmt(sz.old) : '';
  $('#qb-qty').textContent = qb.qty;
  $('#qb-sizes').innerHTML = p.sizes.map(s => `<button class="chip !h-9 !px-4" data-size="${esc(s.label)}" aria-selected="${s.label === qb.size}">${esc(s.label)}</button>`).join('');
  if (qb.shown !== sz.rowId) { qb.shown = sz.rowId; renderDetails(sz.rowId); }   // quantity changes do not reload the details
  syncProductMeta();
}
/* Details (description, unit, stock, extra photos, page link) are fetched when a product is opened, not with the list: the descriptions are long
   (about 500 words for the agrochemicals), so loading all of them up front would slow the grid. Only named columns are read (never `cost`). */
/* @desc-start  (pure helpers; mobile-shell/description.test.mjs runs this block on its own) */
/* Section labels are matched in UPPERCASE only and only at a word start. The old case-insensitive patterns turned ordinary words ("use" in "Ready-to-use", "used", "before use", "get delivery", "Order ...") into headings and cut sentences in half. */
function splitFaq(body) {
  const sentences = String(body).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
  const items = []; let cur = null;
  for (const s of sentences) {
    if (/\?$/.test(s)) { cur = { q: s, a: [] }; items.push(cur); }
    else if (cur) cur.a.push(s);
    else return null;
  }
  return items.length >= 2 && items.every(i => i.a.length) ? items.map(i => ({ q: i.q, a: i.a.join(' ') })) : null;
}
function splitProductDescription(source) {
  const raw = String(source || '').replace(/\bundefined\b/gi, '').replace(/\s*Search phrases relevant to this advert include[\s\S]*$/i, '').trim();
  if (!raw) return [];
  const labels = [
    ['Product overview', /(?:^|\s)(?:PRODUCT SUMMARY|PRODUCT OVERVIEW|OVERVIEW|ABOUT THIS PRODUCT|INTRODUCTION)\s*:?\s*/g],
    ['Key features & benefits', /(?:^|\s)(?:KEY PRODUCT FEATURES|KEY FEATURES(?:\s*(?:&|AND)\s*BENEFITS)?|FEATURES(?:\s*(?:&|AND)\s*BENEFITS)?|BENEFITS)\s*:?\s*/g],
    ['Specifications & details', /(?:^|\s)(?:SPECIFICATIONS(?:\s*(?:&|AND)\s*KEY DETAILS)?|TECHNICAL DETAILS|PRODUCT DETAILS|KEY DETAILS)\s*:?\s*/g],
    ['Uses & applications', /(?:^|\s)(?:WHERE IT HELPS|USES?(?:\s*(?:&|AND)\s*APPLICATIONS?)?|APPLICATIONS?|WHO MAY NEED THIS PRODUCT|IDEAL FOR)\s*:?\s*/g],
    ['How to use', /(?:^|\s)(?:HOW TO USE(?: IT)?|DIRECTIONS FOR USE|USAGE INSTRUCTIONS|PLANNING FOR USE)\s*:?\s*/g],
    ['Before you start', /(?:^|\s)BEFORE YOU START\s*:?\s*/g],
    ['Safety information', /(?:^|\s)(?:SAFETY(?: INFORMATION| PRECAUTIONS| PROTOCOLS)?|IMPORTANT SAFETY NOTES|PRECAUTIONS)\s*:?\s*/g],
    ['Storage & handling', /(?:^|\s)(?:STORAGE(?:\s*(?:&|AND)\s*HANDLING)?|HANDLING)\s*:?\s*/g],
    ['Frequently asked questions', /(?:^|\s)(?:FREQUENTLY ASKED QUESTIONS|FAQS?|COMMON QUESTIONS)\s*:?\s*/g],
    ['Ordering, payment & delivery', /(?:^|\s)(?:ORDER(?:ING)?(?:\s*(?:&|AND)\s*(?:DELIVERY|PAYMENT))?|AVAILABILITY(?:\s*(?:&|AND)\s*DELIVERY)?|DELIVERY(?:\s*(?:&|AND)\s*PAYMENT)?|PAYMENT(?:\s*(?:&|AND)\s*DELIVERY)?)\s*:?\s*/g],
    ['Important buying notes', /(?:^|\s)(?:IMPORTANT NOTES|BUYING NOTES|PLEASE NOTE|IMPORTANT INFORMATION)\s*:?\s*/g]
  ];
  const found = [];
  labels.forEach(([title, re]) => { re.lastIndex = 0; let m; while ((m = re.exec(raw))) found.push({ at: m.index, end: re.lastIndex, title }); });
  found.sort((a, b) => a.at - b.at);
  // Text before the first label is the overview; the text after each label belongs to THAT label's heading.
  const sections = []; let pos = 0, cur = 'Product overview';
  found.forEach(h => { if (h.at < pos) return; const body = raw.slice(pos, h.at).trim(); if (body) sections.push({ title: cur, body }); cur = h.title; pos = h.end; });
  const tail = raw.slice(pos).trim(); if (tail) sections.push({ title: cur, body: tail });
  const merged = [];
  sections.forEach(s => { const prev = merged.find(x => x.title === s.title); if (prev) prev.body += ' ' + s.body; else merged.push({ ...s }); });
  return merged;
}
const PC_TAB = { 'Product overview': 'Overview', 'Key features & benefits': 'Features', 'Specifications & details': 'Specs', 'Uses & applications': 'Uses', 'How to use': 'How to use', 'Before you start': 'Prepare', 'Safety information': 'Safety', 'Storage & handling': 'Storage', 'Frequently asked questions': 'FAQs', 'Ordering, payment & delivery': 'Ordering', 'Important buying notes': 'Notes' };
/* "Label: value" bullets become a two-column table (only when EVERY bullet has that shape). */
function parseSpecs(items) {
  const rows = items.map(t => String(t).match(/^([^:]{2,40}):\s*(\S[\s\S]*)$/));
  return rows.length >= 2 && rows.every(Boolean) ? rows.map(r => [r[1].trim(), r[2].trim()]) : null;
}
/* Instructions written as sentences become numbered steps. */
function splitSteps(body) {
  const s = String(body).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean);
  return s.length >= 2 ? s : null;
}
/* @desc-end */
/* @render-start */
const PC_CSS = `#pp-desc, #qb-desc { white-space:normal !important; overflow-wrap:anywhere; } .product-copy-section { margin: 0 0 14px; padding: 15px 14px 13px; border: 1px solid #ece7f5; border-radius: 14px; background: #fff; box-shadow: 0 2px 8px rgba(34, 20, 60, .045); } .product-copy-section h3 { margin: 0 0 10px; padding: 0 0 9px; color: #5b21b6; font-size: 15px; line-height: 1.3; font-weight: 750; letter-spacing: -.01em; border-bottom: 1px solid #eee8f8; } .product-copy-section p { margin: 0 0 9px; color: #393543; font-size: 13.5px; line-height: 1.7; } .product-copy-section p:last-child { margin-bottom: 0; } .product-copy-section ul { display: grid; gap: 8px; margin: 4px 0 1px; padding: 0; list-style: none; } .product-copy-section li { position: relative; padding-left: 19px; color: #393543; font-size: 13.5px; line-height: 1.6; } .product-copy-section li::before { content: ""; position: absolute; left: 2px; top: .62em; width: 7px; height: 7px; border-radius: 50%; background: #8b5cf6; }
.pc-tabs{display:flex;gap:8px;overflow-x:auto;margin:0 -16px 12px;padding:8px 16px 10px;position:sticky;top:0;z-index:4;background:#fff;border-bottom:1px solid #ece7f5;scrollbar-width:none}
.pc-tabs::-webkit-scrollbar{display:none}
.pc-tabs a{flex:none;padding:7px 13px;border-radius:999px;border:1px solid #e0d8f0;background:#faf8ff;color:#5b21b6;font-size:12.5px;font-weight:700;text-decoration:none;white-space:nowrap}
.pc-tabs a.on{background:#7c3aed;border-color:#7c3aed;color:#fff}
.product-copy-section{scroll-margin-top:54px}
.product-copy-section ul.pc-tick li::before{content:"\\2713";background:none;width:auto;height:auto;border-radius:0;left:0;top:0;color:#15803d;font-weight:800;font-size:13px}
.product-copy-section ul.pc-tick li{padding-left:22px}
.pc-spec{width:100%;border-collapse:collapse;font-size:13px}
.pc-spec th,.pc-spec td{padding:9px 10px;border:1px solid #ece7f5;text-align:left;vertical-align:top;line-height:1.5}
.pc-spec th{width:40%;background:#f6f3fc;color:#4a3d6b;font-weight:650}
.pc-steps{counter-reset:pc;list-style:none;margin:4px 0 0;padding:0;display:grid;gap:11px}
.pc-steps li{position:relative;padding-left:36px;counter-increment:pc;color:#393543;font-size:13.5px;line-height:1.6}
.pc-steps li::before{content:counter(pc);position:absolute;left:0;top:0;width:25px;height:25px;border-radius:50%;background:#7c3aed;color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center}
.product-copy-section.pc-warn{border-color:#f3d79a;background:#fffaf0}
.product-copy-section.pc-warn h3{color:#92400e}
.product-copy-section.pc-warn h3::before{content:"\\26A0\\FE0F  "}
details.pc-q{border-top:1px solid #eee7f7;padding:2px 0}
details.pc-q:first-of-type{border-top:0}
details.pc-q summary{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;font-weight:700;font-size:13.5px;line-height:1.45;color:#2b2540;cursor:pointer;list-style:none}
details.pc-q summary::-webkit-details-marker{display:none}
details.pc-q summary::after{content:"+";flex:none;width:22px;height:22px;border-radius:50%;background:#f1ebff;color:#5b21b6;font-weight:800;display:grid;place-items:center}
details.pc-q[open] summary::after{content:"\\2212"}
details.pc-q p{margin:0 0 12px;padding-right:6px}
.product-copy-section.pc-order{background:#faf8ff;box-shadow:none}`;
function renderProductDescription(target, source) {
  const root = $(target); if (!root) return;
  root.replaceChildren();
  if (!document.getElementById('pc-style')) { const st = document.createElement('style'); st.id = 'pc-style'; st.textContent = PC_CSS; document.head.appendChild(st); }
  const sections = splitProductDescription(source);
  if (!sections.length) { root.textContent = 'Product information will be updated shortly.'; return; }
  const uid = String(target).replace(/[^a-z0-9]/gi, '') + '-s';
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const cards = [];
  sections.forEach((section, i) => {
    const card = el('section', null, 'product-copy-section'); card.id = uid + i;
    card.appendChild(el('h3', section.title));
    const startsWithBullet = /^\s*[•●▪]/.test(section.body);
    const bullets = section.body.split(/\s*[•●▪]\s*/).map(x => x.trim()).filter(Boolean);
    const isList = bullets.length > 1 || (startsWithBullet && bullets.length);
    const faq = section.title === 'Frequently asked questions' ? splitFaq(section.body) : null;
    const specs = isList && section.title === 'Specifications & details' ? parseSpecs(bullets) : null;
    const steps = !isList && section.title === 'How to use' ? splitSteps(section.body) : null;
    if (faq) {
      faq.forEach((item, k) => { const d = el('details', null, 'pc-q'); if (k === 0) d.open = true; d.appendChild(el('summary', item.q)); d.appendChild(el('p', item.a)); card.appendChild(d); });
    } else if (specs) {
      const t = el('table', null, 'pc-spec'), tb = el('tbody'); specs.forEach(([k, v]) => { const tr = el('tr'); const th = el('th', k); th.scope = 'row'; tr.append(th, el('td', v)); tb.appendChild(tr); }); t.appendChild(tb); card.appendChild(t);
    } else if (steps) {
      const ol = el('ol', null, 'pc-steps'); steps.forEach(x => ol.appendChild(el('li', x))); card.appendChild(ol);
    } else if (isList) {
      const lead = startsWithBullet ? '' : bullets.shift(); if (lead) card.appendChild(el('p', lead));
      const ul = el('ul', null, /^(Key features|Before you start)/.test(section.title) ? 'pc-tick' : ''); bullets.forEach(item => ul.appendChild(el('li', item.replace(/^[-–]\s*/, '')))); card.appendChild(ul);
    } else {
      section.body.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9“"'])/).forEach(t => { if (t.trim()) card.appendChild(el('p', t.trim())); });
    }
    if (section.title === 'Safety information') card.classList.add('pc-warn');
    if (section.title.startsWith('Ordering')) card.classList.add('pc-order');
    cards.push(card);
  });
  if (cards.length >= 3) {
    const nav = el('nav', null, 'pc-tabs'); nav.setAttribute('aria-label', 'Product information sections');
    sections.forEach((section, i) => {
      if (section.title.startsWith('Ordering')) return;
      const a = el('a', PC_TAB[section.title] || section.title); a.href = '#' + uid + i;
      a.addEventListener('click', ev => { ev.preventDefault(); nav.querySelectorAll('a').forEach(x => x.classList.remove('on')); a.classList.add('on'); cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      nav.appendChild(a);
    });
    root.appendChild(nav);
  }
  cards.forEach(c => root.appendChild(c));
}
/* @render-end */
const details = new Map(); // Cache product-detail requests by variant row ID; renderDetails() and renderPP() share this cache.
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
  renderProductDescription('#qb-desc', d.description || '');
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
  $('#pp-img').style.background = '#fff'; $('#pp-img').innerHTML = thumb({ img: pp.img || p.img, emoji: p.emoji }, true);
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
  renderProductDescription('#pp-desc', d.description || '');
  const imgs = (d.images || []).filter(Boolean);
  if (!pp.img && imgs[0]) $('#pp-img').innerHTML = thumb({ img: imgs[0], emoji: p.emoji }, true);
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
/* Share: the link to give out is the product's own clean page address, /p/<slug>.html (+ "#<size slug>" for a chosen pack size), with no ?shell=1. It carries the
   product's title, photo and description in its head, so WhatsApp / Facebook / Google show the product, and a phone that opens it lands on this product view
   inside the shell (seo-shell-chrome.mjs inline script + shell-chrome.js). (A /?product= address is one shell page, so it can only preview as the home page.) */
$('#pp-share').addEventListener('click', async () => {
  if (!qb.p) return;
  const url = location.origin + productUrl(), title = qb.p.name + ' | Stermont Arcade';
  try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { toast(url); }
});
$('#pp-plus').addEventListener('click', () => { qb.qty = Math.min(99, qb.qty + 1); renderPP(); renderQB(); });
$('#pp-minus').addEventListener('click', () => { qb.qty = Math.max(1, qb.qty - 1); renderPP(); renderQB(); });
$('#pp-add').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); toast('Added to cart'); });
$('#pp-buy').addEventListener('click', () => { addToCart(qb.p, qb.size, qb.qty); closeAllThen(() => goTab('cart')); });

function openQuickBuy(id) {
  const p = feed.items.get(id); if (!p) return;
  qb.p = p; qb.size = p.sizes[0].label; qb.qty = 1; qb.shown = ''; renderQB(); openOverlay('sheet-quickbuy');
}
function openDeepLink(slug) {   // the full product page for a /?product=<slug> address (any pack size's slug works)
  const hit = x => x.slug === slug || x.id === slug || x.sizes.some(z => z.slug === slug || z.rowId === slug);   // /p/<id>.html pages are named by the row id, which differs from the slug on some products
  const p = PRODUCTS.find(hit);
  if (!p) { toast('That product is no longer available'); return; }
  deepOpen = true;
  qb.p = p; qb.size = (p.sizes.find(z => z.slug === slug || z.rowId === slug) || p.sizes[0]).label; qb.qty = 1; qb.shown = '';
  renderQB(); openProductPage();
}
/* FAST PATH for /?product=<slug> (owner 2026-11-08: the link must go straight to the product, not wait for the whole catalog).
   It reads only what that one product needs: its row, the other rows of its pack-size group, the (small) category list and product-names.json, in parallel with
   the full catalog that Home still loads in the background, and opens the product page as soon as they arrive. When the full catalog lands, the open page is
   refreshed (refreshDeep) so "More like this" fills in. If anything here fails or finds nothing (sold out, unknown slug), the normal path after the full catalog
   still runs, so the behaviour is never worse than before. To undo: delete this function and the call to it in section 11. */
async function quickDeepLink(slug) {
  try {
    if (!/^[A-Za-z0-9._%~-]+$/.test(slug)) return;
    const [cats, names, rows0] = await Promise.all([
      api('categories?select=id,name,slug,parent_id,sort_order,is_promo&order=sort_order.asc,id.asc'),
      fetch('/product-names.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({})),
      api('products?active=eq.true&or=(slug.eq.' + encodeURIComponent(slug) + ',id.eq.' + encodeURIComponent(slug) + ')&select=' + PRODUCT_COLS)
    ]);
    if (deepOpen || fullCatalog || !rows0.length) return;
    let rows = rows0; const g = rows0[0].variant_group;
    if (g) { rows = await api('products?active=eq.true&variant_group=eq.' + encodeURIComponent(g) + '&select=' + PRODUCT_COLS); if (deepOpen || fullCatalog || !rows.length) return; }
    buildCatalog(rows, cats, names);   // PRODUCTS = just this product; the full catalog replaces it when it arrives
    if (!PRODUCTS.some(x => x.slug === slug || x.id === slug || x.sizes.some(z => z.slug === slug || z.rowId === slug))) { PRODUCTS = []; CATS = []; return; }
    openDeepLink(slug);
  } catch (e) { if (!deepOpen && !fullCatalog) { PRODUCTS = []; CATS = []; } }
}
function refreshDeep() {   // the full catalog is in: swap in the full product entry and redraw the open product page (related products, any size changes)
  if (!qb.p) return;
  const f = PRODUCTS.find(x => x.id === qb.p.id); if (!f) return;
  qb.p = f; if (!f.sizes.some(s => s.label === qb.size)) qb.size = f.sizes[0].label;
  if (stack.includes('page-product')) renderPP();
  renderQB();
}
function openCatLink(slug) {   // the Home grid filtered to a /?cat=<slug> address: a top-level category, or a sub-category (its top-level parent + the sub name)
  const c = CATROWS.find(x => x.slug === slug), top = c && (c.parent_id ? CATROWS.find(x => x.id === c.parent_id) : c), t = top && CATS.find(x => x.id === top.slug);
  if (!t) { toast('That category is no longer available'); return; }
  selectCategory(t.id, c.parent_id && t.subs.includes(c.name) ? c.name : '');
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
  $('#cart-empty').hidden = n > 0; $('#cart-total-bar').hidden = n === 0; $('#share-cart').hidden = n === 0;
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
/* Checkout: the shop's own checkout (M-Pesa, delivery fees, order e-mails) lives on /checkout.html. The cart lines are handed over
   under `stm_handoff`; that page adds them through its STM.add once its product cards exist, then opens its cart. */
$('#checkout').addEventListener('click', () => {
  const cart = store.get().cart; if (!cart.length) return;
  try { localStorage.setItem('stm_handoff', JSON.stringify(cart.map(i => ({ rowId: i.rowId, qty: i.qty, price: i.price, name: i.name, size: i.size })))); }
  catch { toast('Could not start checkout. Please allow site storage and try again.'); return; }
  openCheckout();   // the shell cart stays until the order is finished (checkout.html clears it) so a cancelled checkout loses nothing
});
/* The checkout opens in a full-screen layer INSIDE the shell (same-origin frame), so the customer never leaves the shell and no page redirect happens.
   checkout.html tells us it was closed with postMessage({ stmCheckout: 'closed' }); the device Back button closes it too (history entry below). */
let coFrame = null;
function openCheckout() {
  if (coFrame) return;
  const f = document.createElement('iframe');
  f.id = 'checkout-frame'; f.title = 'Checkout'; f.src = '/checkout.html?checkout=1';
  f.setAttribute('allow', 'payment');
  f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:90;background:#fff';
  document.body.appendChild(f); coFrame = f;
  document.body.classList.add('no-scroll');
  history.pushState({ tab: store.get().tab, stack: [...stack], checkout: 1 }, '');
}
function closeCheckout(fromHistory) {
  if (!coFrame) return;
  coFrame.remove(); coFrame = null;
  document.body.classList.toggle('no-scroll', stack.length > 0);
  store.set({ cart: ls.get('cart', []).filter(i => i.rowId) });   // the checkout clears shell.cart once the order is finished; show what is left
  if (!fromHistory && history.state && history.state.checkout) history.back();
}
window.addEventListener('message', e => {
  if (e.origin !== location.origin || !coFrame || e.source !== coFrame.contentWindow) return;
  if (e.data && e.data.stmCheckout === 'closed') closeCheckout(false);
});

/* Share cart link: the address carries the cart lines, so whoever opens it lands on the Cart tab with the same items. */
$('#share-cart').addEventListener('click', async () => {
  const cart = store.get().cart; if (!cart.length) return;
  const url = 'https://stermontarcade.co.ke/?cart=' + cart.map(i => encodeURIComponent(i.rowId) + ':' + i.qty).join(',');
  try { if (navigator.share) { await navigator.share({ title: 'My Stermont Arcade cart', text: 'My cart on Stermont Arcade:', url }); return; } }
  catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Cart link copied'); } catch { window.prompt('Copy your cart link:', url); }
});
function applySharedCart(lines) {   // idempotent: a line already in the cart gets the shared quantity instead of adding to it, so opening the link twice does not double anything
  const cart = store.get().cart.map(i => ({ ...i })); let added = 0, missing = 0;
  lines.forEach(l => {
    const p = PRODUCTS.find(x => x.sizes.some(z => z.rowId === l.rowId));
    if (!p) { missing++; return; }   // sold out or removed since the link was made
    const sz = p.sizes.find(z => z.rowId === l.rowId), key = p.id + '|' + sz.label, hit = cart.find(i => i.key === key);
    if (hit) hit.qty = l.qty; else cart.push({ key, id: p.id, rowId: sz.rowId, name: p.name, size: sz.label, qty: l.qty, price: sz.price, img: p.img, emoji: p.emoji, bg: p.bg });
    added++;
  });
  store.set({ cart });
  try { sessionStorage.removeItem('shell.pendingCart'); } catch {}
  toast(missing ? (added ? 'Some items are no longer available' : 'Those items are no longer available') : 'Cart opened from shared link');
}

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
document.addEventListener('error', e => {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-fallbacks')) return;
  let next = [];
  try { next = JSON.parse(img.dataset.fallbacks || '[]'); } catch {}
  const candidate = next.shift();
  if (candidate) {
    img.dataset.fallbacks = JSON.stringify(next);
    img.src = candidate;
    return;
  }
  const unavailable = document.createElement('span');
  unavailable.className = 'photo-unavailable';
  unavailable.setAttribute('role', 'img');
  unavailable.setAttribute('aria-label', 'Product photo unavailable');
  unavailable.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;padding:8px;color:#64748b;background:#f8fafc;font:12px/1.4 system-ui;text-align:center';
  unavailable.textContent = 'Photo unavailable';
  img.replaceWith(unavailable);
}, true); // try genuine gallery photos in order; never substitute an emoji for a product image
$('#search-form').addEventListener('submit', e => {
  e.preventDefault(); $('#search').blur();
  store.set({ q: $('#search').value.trim(), chip: 'all', sub: '' });
  if (store.get().tab !== 'home') goTab('home');
  refreshGrid();
});
/* Category link: the share button next to the grid title gives out the open category's own clean address (/c/<slug>.html), the same address the address bar shows.
   It is only visible inside a category (syncProductMeta). A phone that opens the link lands in this same category in the shell. */
$('#cat-share')?.addEventListener('click', async () => {
  const u = catUrl(); if (u === '/') return;
  const url = location.origin + u, title = document.title;
  try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Category link copied'); } catch (e) { toast(url); }
});

if (Q_DEEP && !DEEP && !CAT_DEEP) { store.set({ q: Q_DEEP }); $('#search').value = Q_DEEP; }   // a search typed on a static page
const RESTORE_CAT = !DEEP && !CAT_DEEP && !Q_DEEP && !CART_DEEP.length && SAVED_CAT;   // a reload keeps the chosen category (checked against the live categories once they load)
if (RESTORE_CAT) store.set({ chip: SAVED_CAT.chip, sub: SAVED_CAT.sub });
if (DEEP) quickDeepLink(DEEP);   // product link: start the one-product fast path BEFORE the full catalog request below, so it is first in line
syncFilterUI(); refreshGrid(); // Category rails and the drawer are rendered after the live catalogue arrives below; avoid building empty hidden views during first paint.
if (START_TAB !== 'home') showTab(START_TAB);   // a reload on Categories / Deals / Cart / Account stays there (the Home grid still loads underneath)
if (CART_DEEP.length) toast('Loading shared cart...');
loadCatalog().then(() => { if (RESTORE_CAT) { const t = CATS.find(c => c.id === store.get().chip); if (!t) { store.set({ chip: 'all', sub: '' }); refreshGrid(); } else { if (store.get().sub && !t.subs.includes(store.get().sub)) { store.set({ sub: '' }); refreshGrid(); } else $('#grid-title').textContent = store.get().sub || t.name; } } renderChips(); renderCategoriesView(); renderDrawer(); syncDealsBadge(); syncProductMeta(); if (CART_DEEP.length) applySharedCart(CART_DEEP); if (DEEP) { if (deepOpen) refreshDeep(); else openDeepLink(DEEP); } else if (CAT_DEEP) openCatLink(CAT_DEEP); }).catch(() => {});   // categories and the Deals badge appear once the data is in
})();
