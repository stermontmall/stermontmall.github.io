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
    sessionStorage: { getItem: key => key === 'shell.activeTab' ? saved : null },
    history: { state: historyState },
  };
  vm.runInNewContext(productionBlock, context);
  return context.START_TAB;
}

assert.equal(resolve(), 'home', 'fresh visits start on Home');
assert.equal(resolve({ saved: 'categories' }), 'categories', 'saved tab is restored');
assert.match(source, /sessionStorage\.setItem\('shell\.activeTab',\s*tab\)/, 'tab changes persist the active tab');
assert.match(source, /function goTab\(tab\)[\s\S]*?history\.pushState\(st, ''\)[\s\S]*?history\.replaceState\(st, ''\)/, 'tab navigation preserves the Home-back history rule');
assert.equal(resolve({ saved: 'cart', search: '?tab=categories' }), 'categories', 'explicit tab deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?product=sample-item' }), 'home', 'product deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?cat=home-kitchen' }), 'home', 'category deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?q=desk-lamp' }), 'home', 'search deep link takes precedence over saved tab');
assert.equal(resolve({ saved: 'cart', search: '?tab=unknown' }), 'home', 'unknown explicit tab falls back to Home');

assert.match(source, /sessionStorage\\.setItem\\('shell\\.activeTab',\\s*tab\\)/, 'tab changes persist the active tab');
assert.match(source, /function goTab\\(tab\\)[\\s\\S]*?history\\.pushState\\(st, ''\\)[\\s\\S]*?history\\.replaceState\\(st, ''\\)/, 'tab navigation preserves the Home-back history rule');
console.log('OK: mobile shell tab persistence, reload restoration and deep-link precedence');
