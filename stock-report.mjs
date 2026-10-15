// Stermont Arcade - sold-out and low-stock report. Reads the live product list and prints a Markdown report.
// Runs from .github/workflows/stock-report.yml (no installs needed, Node 18+). Read-only: it never changes any product.
import { readFileSync, appendFileSync } from 'node:fs';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public read key, same one the product-page build uses
const DEFAULT_LOW = 5;                                           // used when an item has no low-stock level of its own

async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));   // for local testing only
  const cols = ['id,name,stock,low_at,variant_label,categories(name)', 'id,name,stock,variant_label,categories(name)', 'id,name,stock'];
  for (const c of cols) {
    const all = []; let ok = true;
    for (let from = 0; ; from += 1000) {
      const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=${c}&order=name.asc&limit=1000&offset=${from}`, { headers: { apikey: KEY } });
      if (!r.ok) { ok = false; break; }
      const page = await r.json(); all.push(...page);
      if (page.length < 1000) break;
    }
    if (ok) return all;
  }
  throw new Error('Could not read products from Supabase');
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
