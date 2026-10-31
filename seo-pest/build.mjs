// Plain-text product descriptions for the pest-control batches (same layout the agro batches use: CAPITAL headings,
// bullets, question line then answer line). Facts come ONLY from the batch JSON, which is copied from the catalog text.
// Usage: node seo-pest/build.mjs batch-05   -> seo-pest/out/batch-05.txt (readable), batch-05.report.json, batch-05.sql
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
export const words = s => (String(s).match(/\S+/g) || []).length;

export function renderText(p) {
  const L = [`${p.name} (${p.sizes})`, '', p.lead, '', 'KEY FEATURES', ...p.features.map(f => `• ${f}`), '', 'SPECIFICATIONS', ...p.specs.map(f => `• ${f}`), ''];
  L.push('WHERE IT HELPS', p.helps, '');
  if (p.dose) L.push(p.doseTitle || 'MIXING RATES (FROM THE PRODUCT LABEL)', ...p.dose.map(f => `• ${f}`), '');
  L.push('HOW TO USE IT', p.use, '', 'BEFORE YOU START', ...p.before.map(f => `• ${f}`), '', 'SAFETY', p.safety, '', 'STORAGE', p.storage, '');
  L.push('FREQUENTLY ASKED QUESTIONS', ...p.faq.flatMap(([q, a]) => [q, a, '']));
  L.push('ORDER', `Order ${p.name} online, pay by M-Pesa and get delivery to all 47 counties, or pick up at The Sarit Centre, Westlands, Nairobi. Questions? WhatsApp +254 748 888 230.`);
  return L.join('\n');
}

const sqlTag = '$stmdesc$';
export function renderSql(batch, items) {
  return items.map(p => {
    const t = renderText(p);
    if (t.includes(sqlTag)) throw new Error(`text of ${p.name} contains the SQL quote tag`);
    return `update public.products set description = ${sqlTag}${t}${sqlTag} where variant_group = '${p.group}' or (variant_group is null and id = '${p.group}');`;
  }).join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const batch = process.argv[2] || 'batch-05';
  const items = JSON.parse(fs.readFileSync(path.join(dir, `${batch}.json`), 'utf8'));
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'out', `${batch}.txt`), items.map(renderText).join('\n\n==========\n\n'));
  fs.writeFileSync(path.join(dir, 'out', `${batch}.sql`), renderSql(batch, items));
  const report = items.map(p => ({ group: p.group, words: words(renderText(p)) }));
  fs.writeFileSync(path.join(dir, 'out', `${batch}.report.json`), JSON.stringify(report, null, 1));
  console.table(report);
}
