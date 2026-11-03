// Focused regression test for the mobile shell's tab restoration rules.
// Uses the production START_TAB expression with mocked browser state; no catalogue or network fixtures.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const start = source.indexOf("const TABS = ['home', 'categories', 'deals', 'cart', 'account'];");
assert.notEqual(start, -1, 'production tab allow-list must exist');
const end = source.indexOf('history.replaceState({ tab: START_TAB, stack: [] }', start);
assert.notEqual(end, -1, 'production start-tab resolution must exist');
const productionBlock = source.slice(start, end);

function resolve({ search = '', saved = null, historyState = null } = {}) {
  const context = {
    URLSearchParams,
    location: { search, pathname: '/' },
    DEEP: new URLSearchParams(search).get('product'),
    CAT_DEEP: new URLSearchParams(search).get('cat'),
    Q_DEEP: (new URLSearchParams(search).get('q') || '').trim().slice(0, 80),
    TAB_DEEP: new URLSearchParams(search).get('tab'),
    sessionStorage: { getItem: key => key === 'shell.activeTab' ? saved : null },
    history: { state: historyState },
  };
  return vm.runInNewContext(productionBlock + '; START_TAB', context);
}

assert.equal(resolve(), 'home', 'fresh visits start on Home');
assert.equal(resolve({ saved: 'categories' }), 'categories', 'saved tab is restored');
assert.equal(resolve({ saved: 'not-a-tab' }), 'home', 'invalid saved tab is ignored');
assert.equal(resolve({ saved: 'cart', historyState: { tab: 'deals' } }), 'deals', 'current history state takes precedence');
assert.equal(resolve({ saved: 'cart', search: '?tab=categories' }), 'categories', 'explicit tab deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?product=sample-item' }), 'home', 'product deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?cat=home-kitchen' }), 'home', 'category deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?q=desk-lamp' }), 'home', 'search deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?tab=unknown' }), 'cart', 'unknown explicit tab is ignored and the saved tab is restored');

assert.match(source, /sessionStorage\.setItem\('shell\.activeTab',\s*tab\)/, 'tab changes persist the active tab');
assert.match(source, /function goTab\(tab\)[\s\S]*?history\.pushState\(st, ''\)[\s\S]*?history\.replaceState\(st, ''\)/, 'tab navigation preserves the Home-back history rule');
// Shared cart link (/?cart=id:qty,...): parsed by the production CART_DEEP block, opens the Cart tab, bad lines are dropped.
const cStart = source.indexOf('const CART_DEEP = (() => {'), cEnd = source.indexOf('const TAB_DEEP = CART_DEEP.length');
assert.ok(cStart !== -1 && cEnd > cStart, 'production shared-cart parser must exist');
function cartLines(search, pending = null) {
  const store = new Map(); if (pending) store.set('shell.pendingCart', pending);
  const context = { URLSearchParams, location: { search }, sessionStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) } };
  return JSON.parse(JSON.stringify(vm.runInNewContext(source.slice(cStart, cEnd) + '; CART_DEEP', context)));
}
assert.deepEqual(cartLines('?cart=abc-1:2,xyz:1'), [{ rowId: 'abc-1', qty: 2 }, { rowId: 'xyz', qty: 1 }], 'shared cart lines are parsed');
assert.deepEqual(cartLines('?cart=abc:500,def:0,ghi'), [{ rowId: 'abc', qty: 99 }, { rowId: 'def', qty: 1 }, { rowId: 'ghi', qty: 1 }], 'quantities are clamped to 1-99');
assert.deepEqual(cartLines('?cart=%3Cscript%3E:1,ok:1'), [{ rowId: 'ok', qty: 1 }], 'ids with unexpected characters are dropped');
assert.equal(cartLines('?cart=' + Array.from({ length: 80 }, (_, i) => 'p' + i + ':1').join(',')).length, 40, 'at most 40 lines');
assert.deepEqual(cartLines('', JSON.stringify([{ rowId: 'kept', qty: 3 }])), [{ rowId: 'kept', qty: 3 }], 'a reload before the catalog loaded keeps the pending lines');
assert.deepEqual(cartLines(''), [], 'no cart parameter means no shared lines');
assert.match(source, /const TAB_DEEP = CART_DEEP\.length \? 'cart'/, 'a shared cart link opens the Cart tab');
assert.match(source, /loadCatalog\(\)\.then\([^\n]*applySharedCart\(CART_DEEP\)/, 'shared lines are added once the catalog is loaded');
console.log('OK: mobile shell tab persistence, reload restoration and deep-link precedence');
