// node seo-pest/build.test.mjs  - checks every batch file in seo-pest/ against the owner's rules
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderText, fillMeta, wordCount, sentences, renderSql } from './build.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
// Claims nothing in the repo can back (same list as the agro batches and seo-meta.mjs).
const banned = /guarantee|certified|#1 rated|top-rated|instant knockdown|maximum strength|pcpb[- ]approved|best price|100% genuine|fast action/i;
let checks = 0, bad = 0;
const ok = (c, m) => { checks++; if (!c) { bad++; console.log('FAIL', m); } };
for (const f of fs.readdirSync(dir).filter(f => /^batch-\d+\.json$/.test(f))) {
  const batch = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const seen = new Set();
  for (const p of batch) {
    const id = f + ' ' + p.group;
    const text = renderText(p), meta = fillMeta(p);
    const words = wordCount(text);
    ok(words >= 300 && words <= 600, id + ' word count ' + words);
    ok(sentences(p.hook) === 2, id + ' hook must be 2 sentences, has ' + sentences(p.hook));
    ok(meta.length >= 140 && meta.length <= 155, id + ' meta length ' + meta.length);
    ok(/KSh [\d,]+/.test(meta) && /M-Pesa/.test(meta) && /47 counties/.test(meta), id + ' meta needs price, M-Pesa and 47 counties');
    ok(/Kenya|47 counties/.test(meta), id + ' meta mentions Kenya or counties');
    if (p.seo) {
      ok(p.seo.seo_title.length < 60, id + ' meta title length ' + p.seo.seo_title.length);
      ok(/in Kenya/.test(p.seo.seo_title), id + ' meta title needs "in Kenya"');
      ok(/\| Stermont Arcade$/.test(p.seo.seo_title), id + ' meta title ends with the brand');
      ok(p.seo.seo_name.length < 65, id + ' seo_name length ' + p.seo.seo_name.length);
    }
    ok(!banned.test(text + ' ' + meta + ' ' + (p.seo ? p.seo.seo_title + p.seo.seo_name : '')), id + ' banned claim');
    for (const h of ['KEY FEATURES & BENEFITS', 'TECHNICAL SPECIFICATIONS', 'HOW TO USE', "WHAT'S IN THE BOX", 'SAFETY & STORAGE', 'ORDER']) ok(text.includes('\n' + h + '\n'), id + ' missing ' + h);
    ok(/^Active ingredients?/m.test(text.replace(/• /g, '')), id + ' needs an Active ingredient line (or "see label")');
    ok(p.specs.some(([k, v]) => /^Active ingredient/.test(k) && (!/See the product label/.test(v) || p.labelNeeded.some(x => /Active ingredient/i.test(x)))), id + ' unknown active ingredient must be listed in labelNeeded');
    ok(p.keywords.length >= 5 && p.keywords.length <= 8, id + ' needs 5-8 keywords, has ' + p.keywords.length);
    ok(!/["<>]/.test(text) && !/ \n|\n /.test(text), id + ' stray quote, tag or spacing');
    ok(p.ids.length >= 1 && p.ids.includes(p.pageId) , id + ' pageId must be one of ids');
    ok(!p.ids.some(i => seen.has(i)), id + ' id listed twice'); p.ids.forEach(i => seen.add(i));
    // Dose and interval figures only where the batch says they come from the catalog or the maker (labelData).
    if (!p.labelData) {
      ok(!/\b\d+\s?(ml|g|l|litres?)\s*per\s*(l|litre|ha|hectare|knapsack|20)/i.test(text), id + ' invented dose');
      ok(!/\b\d+\s?(hours?|days?|weeks?)\b/i.test(text), id + ' invented interval');
    }
  }
  const sql = renderSql(batch, f.replace('.json', '')).replace(/^--.*$/mg, '');
  ok(/^insert into description_backup/m.test(sql) && sql.indexOf('insert into description_backup') < sql.indexOf('update products'), f + ' backup must come before the first update');
  ok((sql.match(/update products set description/g) || []).length === batch.length, f + ' one description update per product');
}
console.log(checks + ' checks, ' + bad + ' violations');
process.exit(bad ? 1 : 0);
