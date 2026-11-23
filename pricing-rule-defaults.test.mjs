import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const admin = read('admin.html');
const rulesUi = read('admin-publishing-rules.js');
const bulk = read('admin-bulk.js');
const catalog = read('catalog-v10.js');
const photoAi = read('admin-photo-ai.js');
const legacyUploader = read('list-products.html');
const migration = read('database/enforce-canonical-four-tier-product-defaults.sql');
const oldPriceMigration = read('database/no-fake-old-price-on-new-products.sql');
const claude = read('CLAUDE.md');
const agents = read('AGENTS.md');
const publishing = read('PUBLISHING_RULES.md');

assert.match(admin, /admin-publishing-rules\.js/);
assert.match(admin, /'pricing-rules'/);
assert.match(admin, /STMPublishingRules\.mount/);
assert.match(rulesUi, /apirest\.c-10\.eu-central-1\.aws\.neon\.tech/);
assert.match(rulesUi, /publishing_rules\?select=key,version,title,content,updated_at/);
assert.match(rulesUi, /GOVERNING_KEY = 'publish_products'/);
assert.doesNotMatch(rulesUi, /autonomous_bulk_product_publishing|\/rest\/v1\/publishing_rules\?select=key,rule_text/);

assert.match(bulk, /baseline_cost_kes/);
assert.match(bulk, /price: o\.price, cost: o\.cost, stock: 1000, low_at: 20, featured: false, active: false/);
assert.doesNotMatch(bulk, /Owner rule 2026-11-02|Math\.ceil\(n \* 1\.25\)/);

assert.match(catalog, /b < 20000 \? 1\.30/);
assert.match(catalog, /b < 40000 \? 1\.25/);
assert.match(catalog, /b <= 60000 \? 1\.20 : 1\.175/);
assert.match(catalog, /row\.stock = 1000; row\.low_at = 20; row\.featured = false; row\.active = false/);
assert.match(catalog, /if \(!\(row\.old_price > row\.price\)\) row\.old_price = null/);
assert.doesNotMatch(bulk, /row\.price \+ 50/);

assert.match(photoAi, /official four-tier rule/i);
assert.doesNotMatch(photoAi, /selling_price_kes:\s*r\.price/);

assert.match(migration, /public\.price_4tier\(new\.cost\)/);
assert.match(migration, /new\.stock := 1000/);
assert.match(migration, /new\.low_at := 20/);
assert.match(migration, /new\.active := false/);
assert.match(oldPriceMigration, /new\.old_price := null/);
assert.match(claude, /PUBLISHING_RULES\.md/);
assert.match(agents, /PUBLISHING_RULES\.md/);
assert.match(publishing, /price_4tier\(cost\)/);
assert.match(publishing, /data\/photo-queue\.txt/);
assert.match(publishing, /200 x 200/);
assert.match(publishing, /JPG, JPEG, PNG, WebP and AVIF/);
assert.match(publishing, /UPDATE public\.products SET active = true, low_at = 50/);

console.log('PASS: admin rulebook and canonical Neon Version 6 publishing rules are aligned.');
