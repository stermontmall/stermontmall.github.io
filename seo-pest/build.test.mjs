// node seo-pest/build.test.mjs  -> checks every description in every batch file in this folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderText, words } from './build.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
let checks = 0; const bad = [];
const ok = (cond, msg) => { checks++; if (!cond) bad.push(msg); };
const BANNED = [/\bguarantee/i, /100\s?%/, /\bcure[sd]?\b/i, /\bcertified\b/i, /\bbest\b/i, /#1/, /top-rated/i, /pcpb[- ]approved/i, /\bsafe for (babies|children|kids|pets)\b/i, /\bnon-?toxic\b/i, /\bKSh\s?\d/i];
const DOSE = /\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?)\s?(?:per|\/)\s?(?:litre|liter|l|kg|acre|hectare|tank|knapsack|bird|animal|water|m2|m²)\b/i;
for (const f of fs.readdirSync(dir).filter(f => /^batch-\d+\.json$/.test(f))) {
  const items = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  ok(items.length <= 10, `${f}: more than 10 products`);
  for (const p of items) {
    const t = renderText(p), w = words(t), id = `${f} ${p.group}`;
    ok(w >= 400 && w <= 600, `${id}: ${w} words (need 400-600)`);
    for (const re of BANNED) ok(!re.test(t), `${id}: banned phrase ${re}`);
    if (!p.dose) ok(!DOSE.test(t), `${id}: contains a dose and the batch file has no label data (dose)`);
    ok(p.faq.length >= 3, `${id}: needs 3 or more FAQs`);
    ok(/WhatsApp \+254 748 888 230/.test(t) && /M-Pesa/.test(t) && /47 counties/.test(t), `${id}: order line missing`);
    ok(t.startsWith(p.name), `${id}: title line must start with the product name`);
    ok(!/\bAs an AI\b/i.test(t), `${id}: mentions AI`);
    ok(new Set(p.faq.map(x => x[0])).size === p.faq.length, `${id}: duplicate FAQ`);
    ok(/label|instructions on the pack/i.test(t), `${id}: no pointer to the label`);
  }
  // no two descriptions may share a paragraph (each product text must be its own)
  const seen = new Map();
  for (const p of items) for (const para of renderText(p).split('\n').filter(l => words(l) > 12 && !/^Order /.test(l))) {
    ok(!seen.has(para) || seen.get(para) === p.group, `${f}: paragraph shared by ${seen.get(para)} and ${p.group}: ${para.slice(0, 50)}`);
    seen.set(para, p.group);
  }
}
console.log(`${checks} checks, ${bad.length} violations`);
bad.forEach(b => console.log(' -', b));
process.exit(bad.length ? 1 : 0);
