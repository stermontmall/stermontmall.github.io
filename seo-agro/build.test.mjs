// node seo-agro/build.test.mjs  - checks every batch file in seo-agro/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, renderText } from './build.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const banned = /guarantee|certified|#1 rated|top-rated|instant knockdown|maximum strength|pcpb[- ]approved/i;
let checks = 0, bad = 0;
const ok = (c, m) => { checks++; if (!c) { bad++; console.log('FAIL', m); } };
for (const f of fs.readdirSync(dir).filter(f => /^batch-\d+\.json$/.test(f))) {
  for (const p of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
    const { meta, html } = render(p);
    const id = f + ' ' + p.group;
    ok(meta && meta.length >= 150 && meta.length <= 160, id + ' meta length ' + (meta && meta.length));
    const words = renderText(p).split(/\s+/).filter(Boolean).length;
    ok(words >= 300 && words <= 600, id + ' word count ' + words);
    ok(!banned.test(meta + html), id + ' banned claim');
    ok((html.match(/<h3>/g) || []).length === 5, id + ' needs 5 sections');
    ok(/KSh [\d,]+/.test(meta), id + ' price in meta');
    ok(p.ai || p.labelNeeded.some(x => /active ingredient/.test(x)), id + ' missing AI must be flagged');
    // Products flagged labelData carry dose/interval figures taken from the catalog text (listed in the batch file); all others must have none.
    if (!p.labelData) {
      ok(!/\b\d+\s?(ml|g|l|litres?)\s*per\s*(l|litre|ha|hectare|knapsack|20)/i.test(html), id + ' invented dose');
      ok(!/\d+\s?(hours?|days?)\b/i.test(html.replace(/<!--.*?-->/g, '')), id + ' invented interval');
    } else {
      ok(p.dose || p.preHarvest || p.reentry, id + ' labelData flag without figures');
    }
  }
}
console.log(checks + ' checks, ' + bad + ' violations');
process.exit(bad ? 1 : 0);
