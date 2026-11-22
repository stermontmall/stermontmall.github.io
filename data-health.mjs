// Stermont Arcade - daily catalog health check.
// Reads the PUBLIC catalog (same data shoppers see, anon key only, no secrets) and writes data-health-report.md.
// The database already blocks zero-price and duplicate products; this catches what it cannot:
// missing photos, missing descriptions, suspicious stock numbers, and (as a backstop) price/duplicate problems.
import { writeFileSync } from 'node:fs';

const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const STOCK_SUSPICIOUS = 5000;

const pageSize = 200;
const rows = [];
for (let offset = 0; ; offset += pageSize) {
  const res = await fetch(NEON_REST + 'rpc/get_product_pages', {
    headers: { Range: offset + '-' + (offset + pageSize - 1), 'Range-Unit': 'items' },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) {
    console.error('Could not read the Neon catalog:', res.status, await res.text());
    process.exit(1);
  }
  const batch = await res.json();
  if (!Array.isArray(batch)) throw new Error('Neon catalog returned an invalid response');
  rows.push(...batch);
  if (batch.length < pageSize) break;
}

const label = (p) => `${p.name}${p.variant_label ? ' (' + p.variant_label + ')' : ''}`;
const norm = (p) => `${p.name || ''} ${p.variant_label || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
const hasImg = (p) => Array.isArray(p.images) ? p.images.length > 0 : !!p.images;

const seen = new Map();
const dupes = [];
for (const p of rows) {
  const k = norm(p);
  if (seen.has(k)) dupes.push(`${label(seen.get(k))} / ${label(p)}`); else seen.set(k, p);
}

const checks = [
  ['Price is 0 or missing (shoppers could order it free)', rows.filter((p) => !(Number(p.price) > 0)).map(label)],
  ['Duplicate products (same name and pack size)', dupes],
  ['No product photo (hurts Google Merchant and sales)', rows.filter((p) => !hasImg(p)).map(label)],
  ['No description (weak SEO)', rows.filter((p) => !String(p.description || '').trim()).map(label)],
  ['Description under 100 characters (too little product context for useful search snippets)', rows.filter((p) => String(p.description || '').trim().length > 0 && String(p.description).trim().length < 100).map((p) => `${label(p)} (${String(p.description).trim().length} chars)`)],
  ['Missing product name', rows.filter((p) => !String(p.name || '').trim()).map((p) => `Product ID ${p.id}`)],
  [`Suspicious stock (${STOCK_SUSPICIOUS}+ pieces, check for a typo)`, rows.filter((p) => Number(p.stock) >= STOCK_SUSPICIOUS).map((p) => `${label(p)}: ${p.stock}`)],
];

let md = `# Catalog health report\n\nChecked ${rows.length} active products on ${new Date().toISOString().slice(0, 10)}.\n\n`;
let problems = 0;
for (const [title, list] of checks) {
  problems += list.length;
  md += `## ${list.length ? '⚠️' : '✅'} ${title}: ${list.length}\n`;
  if (list.length) md += list.slice(0, 40).map((x) => `- ${x}`).join('\n') + (list.length > 40 ? `\n- …and ${list.length - 40} more` : '') + '\n';
  md += '\n';
}
writeFileSync('data-health-report.md', md);
writeFileSync('data-health-count.txt', String(problems));
console.log(md);
