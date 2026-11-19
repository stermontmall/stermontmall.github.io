import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const admin = readFileSync(new URL('./admin.html', import.meta.url), 'utf8');
const panel = readFileSync(new URL('./admin-pricing-rules.js', import.meta.url), 'utf8');
const guide = readFileSync(new URL('./PUBLISHING.md', import.meta.url), 'utf8');
const rules = readFileSync(new URL('./PRICING-RULES.md', import.meta.url), 'utf8');
const policy = readFileSync(new URL('./supabase/sql/staff-read-publishing-rules.sql', import.meta.url), 'utf8');

assert.match(admin, /admin-pricing-rules\.js\?v=1/);
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

console.log('PASS: canonical pricing rule is visible in staff admin and docs, and Supabase read access is staff-only.');
