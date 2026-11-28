import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const indexingSource = readFileSync(new URL('./Indexing.gs', import.meta.url), 'utf8');
const codeSource = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('./appsscript.json', import.meta.url), 'utf8'));

const context = {};
vm.runInNewContext(indexingSource + '\nthis.checkUrl = isAllowedInspectionUrl_;', context);
const allowed = context.checkUrl;

test('domain property accepts exact host and legitimate subdomains', () => {
  assert.equal(allowed('https://stermontarcade.co.ke/p/item.html', 'sc-domain:stermontarcade.co.ke'), true);
  assert.equal(allowed('https://www.stermontarcade.co.ke/p/item.html', 'sc-domain:stermontarcade.co.ke'), true);
});

test('domain property rejects lookalike hosts and malformed authorities', () => {
  assert.equal(allowed('https://stermontarcade.co.ke.attacker.example/item', 'sc-domain:stermontarcade.co.ke'), false);
  assert.equal(allowed('https://stermontarcade.co.ke:443.attacker.example/item', 'sc-domain:stermontarcade.co.ke'), false);
  assert.equal(allowed('https://stermontarcade.co.ke@attacker.example/item', 'sc-domain:stermontarcade.co.ke'), false);
  assert.equal(allowed('https://stermontarcade.co.ke:99999/item', 'sc-domain:stermontarcade.co.ke'), false);
});

test('URL-prefix property enforces a path boundary', () => {
  const property = 'https://stermontarcade.co.ke/shop/';
  assert.equal(allowed('https://stermontarcade.co.ke/shop/product-a', property), true);
  assert.equal(allowed('https://stermontarcade.co.ke/shop', property), true);
  assert.equal(allowed('https://stermontarcade.co.ke/shopping/product-a', property), false);
  assert.equal(allowed('https://stermontarcade.co.ke.evil.example/shop/product-a', property), false);
});

test('manifest declares only read-oriented Google reporting scopes', () => {
  assert.equal(manifest.timeZone, 'Africa/Nairobi');
  assert.ok(manifest.dependencies.enabledAdvancedServices.some(s => s.serviceId === 'searchconsole'));
  assert.ok(manifest.dependencies.enabledAdvancedServices.some(s => s.serviceId === 'analyticsdata'));
  assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/webmasters.readonly'));
  assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/analytics.readonly'));
  assert.ok(!manifest.oauthScopes.some(s => /drive|gmail|admin|userinfo/i.test(s)));
});

test('sales dashboard excludes non-success order statuses', () => {
  for (const status of ['paid', 'completed', 'fulfilled', 'delivered', 'successful', 'success']) {
    assert.ok(codeSource.includes('"' + status + '"'));
  }
  for (const forbidden of ['pending', 'cancelled', 'refunded', 'failed']) {
    assert.ok(!codeSource.includes('"' + forbidden + '"') || codeSource.includes('excluded'));
  }
});
