import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const admin = read('admin.html');
const rulesUi = read('admin-publishing-rules.js');
const bulk = read('admin-bulk.js');
const catalog = read('catalog-v10.js');
const photoAi = read('admin-photo-ai.js');
const legacyUploader = read('list-products.html');
const policy = JSON.parse(read('rules/publishing-rule.json'));
const migration = read('database/enforce-canonical-four-tier-product-defaults.sql');
const claude = read('CLAUDE.md');
const agents = read('AGENTS.md');
const publishing = read('PUBLISHING.md');

assert.match(admin, /admin-publishing-rules\.js/);
assert.match(admin, /'pricing-rules'/);
assert.match(admin, /STMPublishingRules\.mount/);
assert.match(rulesUi, /publishing_rules\?select=key,rule_text,config,updated_at/);
assert.match(rulesUi, /autonomous_bulk_product_publishing/);

assert.match(bulk, /baseline_cost_kes/);
assert.match(bulk, /price: o\.price, cost: o\.cost, stock: 1000, low_at: 20, featured: false, active: false/);
assert.doesNotMatch(bulk, /Owner rule 2026-11-02|Math\.ceil\(n \* 1\.25\)/);

assert.match(catalog, /b < 20000 \? 1\.30/);
assert.match(catalog, /b < 40000 \? 1\.25/);
assert.match(catalog, /b <= 60000 \? 1\.20 : 1\.175/);
assert.match(catalog, /row\.stock = 1000; row\.low_at = 20; row\.featured = false; row\.active = false/);
assert.match(catalog, /if \(!\(row\.old_price > row\.price\)\) row\.old_price = null/);
assert.doesNotMatch(bulk, /row\.price \+ 50/);

assert.match(photoAi, /official four-tier rule/);
assert.doesNotMatch(photoAi, /selling_price_kes:\s*r\.price/);

assert.deepEqual(policy.pricing.tiers.map(t => t.markup_pct), [30, 25, 20, 17.5]);
assert.equal(policy.inventory_defaults.stock, 1000);
assert.equal(policy.inventory_defaults.low_at, 20);
assert.equal(policy.inventory_defaults.featured, false);
assert.equal(policy.inventory_defaults.active, false);

assert.match(migration, /public\.price_4tier\(new\.cost\)/);
assert.match(migration, /new\.stock := 1000/);
assert.match(migration, /new\.low_at := 20/);
assert.match(migration, /new\.active := false/);
assert.match(claude, /public\.products_posting_rules\(\)/);
assert.match(agents, /public\.products_posting_rules\(\)/);
assert.match(publishing, /public\.price_4tier/);

console.log('PASS: admin rulebook, four-tier pricing, hidden-draft defaults and database enforcement are aligned.');
