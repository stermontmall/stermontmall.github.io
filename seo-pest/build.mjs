// Stermont Arcade - pest control product copy (batch files in seo-pest/).
// Usage: node seo-pest/build.mjs batch-01        prints a report (words, meta length, title lengths)
//        node seo-pest/build.mjs batch-01 --sql  writes seo-pest/out/batch-01.sql (backup + update statements, paste-ready)
//        node seo-pest/build.mjs batch-01 --overrides  prints the seo-overrides.json entries (meta description per page)
// Only facts in the batch JSON are used. Anything not known stays "see label" and is listed in labelNeeded.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));

const SAFETY_BASE = 'Check the PCPB registration number on the label and read the label before use. Keep locked out of reach of children.';
const ORDER = 'Pay by M-Pesa. Delivery to all 47 counties, or pick up at The Sarit Centre, Westlands, Nairobi. Questions? WhatsApp +254 748 888 230.';

export const priceText = n => 'KSh ' + Number(n).toLocaleString('en-US');
export const fillMeta = p => p.meta.replace(/\{price\}/g, priceText(p.fromPrice));

// The plain-text description stored in products.description (seo-product-extras.mjs turns CAPITAL lines into headings and bullets into lists).
export function renderText(p) {
  const L = [];
  L.push(p.titleLine, '', p.hook, '');
  L.push('KEY FEATURES & BENEFITS', ...p.features.map(f => '• ' + f), '');
  L.push(p.whereHeading, p.where, '');
  L.push('TECHNICAL SPECIFICATIONS', ...p.specs.map(([k, v]) => `• ${k}: ${v}`), '');
  L.push('HOW TO USE', ...p.steps, '');
  L.push("WHAT'S IN THE BOX", ...p.box.map(b => '• ' + b), '');
  L.push('SAFETY & STORAGE', `${SAFETY_BASE} ${p.safety}`, '');
  L.push('ORDER', ORDER);
  return L.join('\n');
}

export const wordCount = s => s.split(/\s+/).filter(Boolean).length;
export const sentences = s => s.split(/[.!?](?:\s|$)/).filter(x => x.trim()).length;

// SQL: backup the old text first (description_backup, same table the agro batches use), then write the new text and (where set) the titles.
export function renderSql(batch, name) {
  const rows = batch.flatMap(p => p.ids.map(id => ({ id, p })));
  const idList = rows.map(r => `'${r.id}'`).join(', ');
  let sql = `-- ${name}: backup, then write. Restore one row: update products p set description = b.description from description_backup b where b.id = p.id and b.batch = 'pest-${name}' and p.id = '<id>';\n`;
  sql += `insert into description_backup (id, description, batch) select id, description, 'pest-${name}' from products where id in (${idList}) and not exists (select 1 from description_backup b where b.id = products.id and b.batch = 'pest-${name}');\n`;
  for (const p of batch) {
    const ids = p.ids.map(i => `'${i}'`).join(', ');
    const text = renderText(p);
    if (text.includes('$d$')) throw new Error('dollar-quote clash in ' + p.group);
    sql += `update products set description = $d$${text}$d$ where id in (${ids});\n`;
    if (p.seo) sql += `update products set seo_name = $d$${p.seo.seo_name}$d$, seo_title = $d$${p.seo.seo_title}$d$ where id in (${ids}) and seo_title is null;\n`;
  }
  return sql;
}

// seo-overrides.json entries: meta description per page file name (the page id). {price} stays a token, filled from the built page.
export function overrides(batch, titleOf) {
  const o = {};
  for (const p of batch) o[p.pageId] = { title: titleOf(p), desc: p.meta };
  return o;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  const name = process.argv[2] || 'batch-01';
  const batch = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
  if (process.argv.includes('--sql')) {
    fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'out', name + '.sql'), renderSql(batch, name));
    console.log('wrote seo-pest/out/' + name + '.sql');
  } else if (process.argv.includes('--overrides')) {
    console.log(JSON.stringify(overrides(batch, p => (p.seo && p.seo.seo_title) || ''), null, 2));
  } else {
    for (const p of batch) {
      const t = renderText(p);
      console.log(`${p.group}: ${wordCount(t)} words, meta ${fillMeta(p).length} chars, title ${p.seo ? p.seo.seo_title.length : '-'}, name ${p.seo ? p.seo.seo_name.length : '-'}`);
    }
  }
}
