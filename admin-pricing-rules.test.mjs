import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const admin = readFileSync(new URL('./admin.html', import.meta.url), 'utf8');
const panel = readFileSync(new URL('./admin-pricing-rules.js', import.meta.url), 'utf8');
const guide = readFileSync(new URL('./PUBLISHING.md', import.meta.url), 'utf8');
const rules = readFileSync(new URL('./PRICING-RULES.md', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('./catalog-v10.js', import.meta.url), 'utf8');
const ruleJson = JSON.parse(readFileSync(new URL('./rules/publishing-rule.json', import.meta.url), 'utf8'));
const canonicalSql = readFileSync(new URL('./supabase/sql/canonical_four_tier_product_pricing.sql', import.meta.url), 'utf8');
const sqlHelper = readFileSync(new URL('./database/add-draft-product-unique-opening.sql', import.meta.url), 'utf8');
const policy = readFileSync(new URL('./supabase/sql/staff-read-publishing-rules.sql', import.meta.url), 'utf8');

assert.match(admin, /admin-pricing-rules\.js\?v=2/);
assert.match(admin, /'pricing-rules'/);
assert.match(admin, /Store[\s\S]*Pricing rules/);
assert.match(admin, /STMPricingRules\.mount\(L\)/);
assert.match(panel, /publishing_rules\?key=eq\.autonomous_bulk_product_publishing/);
assert.match(panel, /markup_tiers/);
assert.match(panel, /min_margin_pct/);
assert.match(panel, /View the exact pricing section stored in Supabase/);
assert.match(rules, /Below KSh 20,000 \| 30%/);
assert.match(rules, /KSh 20,000–39,999 inclusive \| 25%/);
assert.match(rules, /KSh 40,000–60,000 inclusive \| 20%/);
assert.match(rules, /Above KSh 60,000 \| 17\.5%/);
assert.match(guide, /canonical four-tier pricing rule/i);
assert.doesNotMatch(guide, /stored selling price must equal.*cost \* 1\.30/i);
assert.match(policy, /to authenticated/i);
assert.match(policy, /using \(public\.is_staff\(\)\)/i);
assert.doesNotMatch(policy, /to anon/i);

assert.match(admin, /catalog-v10\\.js\\?v=15/);
assert.match(catalog, /function up\\(n\\)[\\s\\S]*b < 20000[\\s\\S]*b < 40000[\\s\\S]*b <= 60000[\\s\\S]*1\\.175/);
assert.match(catalog, /rest\\/v1\\/rpc\\/price_4tier/);
assert.doesNotMatch(catalog, /MARKUP\\s*=\\s*1\\.30/);
assert.match(catalog, /edit \\? p\\.stock : '1000'/);
assert.match(catalog, /edit \\? p\\.low_at : 20/);
assert.match(sqlHelper, /public\\.price_4tier\\(v_source_cost\\)/);
assert.doesNotMatch(sqlHelper, /p_markup_pct/);
assert.match(canonicalSql, /create or replace function public\\.price_4tier/);
assert.match(canonicalSql, /when b < 20000 then 1\\.30[\\s\\S]*when b < 40000 then 1\\.25[\\s\\S]*when b <= 60000 then 1\\.20[\\s\\S]*else 1\\.175/);
assert.equal(ruleJson.pricing.default_for_new_products, true);
assert.equal(ruleJson.pricing.source_of_truth, 'Supabase public.price_4tier(p_baseline)');
assert.equal(ruleJson.pricing.tiers.length, 4);

console.log('PASS: canonical pricing rule is visible in staff admin and docs, and Supabase read access is staff-only.');
