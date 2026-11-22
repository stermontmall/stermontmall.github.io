// Stermont Arcade - sold-out and low-stock report. Reads the live product list and prints a Markdown report.
// Runs from .github/workflows/stock-report.yml (no installs needed, Node 18+). Read-only: it never changes any product.
import { readFileSync, appendFileSync } from 'node:fs';

const NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const DEFAULT_LOW = 5;                                           // used when an item has no low-stock level of its own

async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const r = await fetch(NEON_REST + 'rpc/get_product_pages', { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('Could not read products from Neon: HTTP ' + r.status);
  const rows = await r.json();
  if (!Array.isArray(rows)) throw new Error('Neon returned an invalid stock report dataset');
  return rows;
}

const rows = (await getProducts()).filter(p => p && p.id && p.name);
const label = p => p.name + (p.variant_label ? ` · ${p.variant_label}` : '');
const tracked = rows.filter(p => p.stock != null && p.stock !== '' && Number.isFinite(Number(p.stock)));   // empty stock = not tracked, ignored
const level = p => (Number(p.low_at) > 0 ? Number(p.low_at) : DEFAULT_LOW);
const out = tracked.filter(p => Number(p.stock) <= 0);
const low = tracked.filter(p => Number(p.stock) > 0 && Number(p.stock) <= level(p)).sort((a, b) => Number(a.stock) - Number(b.stock));
const list = (arr, fmt) => arr.slice(0, 40).map(fmt).join('\n') + (arr.length > 40 ? `\n- …and ${arr.length - 40} more` : '');

let md = `# Stock report ${new Date().toISOString().slice(0, 10)}\n\nChecked ${rows.length} active items (${tracked.length} with stock counts). `;
md += out.length || low.length ? `**${out.length}** sold out, **${low.length}** running low.\n` : 'Everything is in stock. 🎉\n';
if (out.length) md += `\n### Sold out (${out.length})\nThese show as sold out on the site and cannot be ordered.\n${list(out, p => `- ${label(p)}`)}\n`;
if (low.length) md += `\n### Running low (${low.length})\n${list(low, p => `- ${label(p)}: **${Number(p.stock)}** left`)}\n`;
md += '\nUpdate stock in the admin Catalog tab; product pages refresh within about 3 hours.\n';
console.log(md);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `items=${out.length + low.length}\n`);
