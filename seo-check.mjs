// Stermont Arcade - daily SEO health check. Reads the built pages in this repo and prints a Markdown report.
// Runs from .github/workflows/seo-daily.yml (no installs needed, Node 18+).
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const issues = {};   // problem -> [pages]
const add = (what, page) => (issues[what] = issues[what] || []).push(page);
const files = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.html')).map(f => `${d}/${f}`) : []);
const pages = [...files('p'), ...files('c'), ...files('blog'), 'products.html', 'index.html'].filter(existsSync);
const unesc = t => String(t).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');   // measure what Google sees, not the escaped HTML
const exists = path => { path = decodeURIComponent(path.split('#')[0].split('?')[0]); if (!path || path === '/') path = '/index.html'; if (path.endsWith('/')) path += 'index.html'; return existsSync('.' + path); };
let redirects = 0, checked = 0;

for (const f of pages) {
  const h = readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/i.test(h)) { redirects++; continue; }   // size-variant redirect pages
  checked++;
  const title = unesc((h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const dm = h.match(/<meta name=["']description["'] content=(?:"([^"]*)"|'([^']*)')/i), desc = dm ? unesc(dm[1] || dm[2] || '') : '';   // blog posts use single quotes, product pages double
  if (!title.trim()) add('Missing page title', f); else if (title.length > 75) add('Title longer than 75 characters (Google cuts it off)', f);
  if (!desc.trim()) add('Missing meta description', f); else if (desc.length < 70) add('Meta description under 70 characters', f); else if (desc.length > 165) add('Meta description over 165 characters', f);
  if (!/<link rel=["']canonical["']/i.test(h)) add('Missing canonical link', f);
  const h1 = (h.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) add(h1 ? 'More than one H1 heading' : 'Missing H1 heading', f);
  (h.match(/<img\b[^>]*>/gi) || []).forEach(t => { if (!/\balt=/i.test(t)) add('Image without alt text', f); });
  for (const m of h.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) { try { JSON.parse(m[1]); } catch { add('Broken structured data (JSON-LD)', f); } }
  if (f.startsWith('p/')) {
    if (!/<img\b(?![^>]*placeholder\.svg)/i.test(h)) add('Product page has no photo (also left out of the Google Shopping feed)', f);
    // The description sits in <div class="desc"> (or the older <section class="desc">). Count the real text, whichever heading the page builder uses.
    const dd = h.match(/class="desc"[^>]*>([\s\S]*?)<\/(?:div|section)>/i), dtext = dd ? dd[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    if (dtext.length < 100) add('Product has no description (short pages rank poorly)', f);
    if (!/"@type":"(Product|ProductGroup)"/.test(h)) add('Missing Product structured data', f);
  }
  for (const m of h.matchAll(/href=["']([^"'#]+)[^"']*["']/gi)) {
    let u = m[1]; if (u.startsWith(SITE)) u = u.slice(SITE.length) || '/';
    if (u.startsWith('/') && !u.startsWith('//') && !exists(u)) add(`Broken internal link ${u}`, f);
  }
}
// every sitemap URL must exist
for (const sm of ['sitemap.xml', 'sitemap-products.xml']) if (existsSync(sm))
  for (const m of readFileSync(sm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) { const u = m[1].replace(SITE, ''); if (u.startsWith('/') && !exists(u)) add('Sitemap lists a page that does not exist', `${sm}: ${u}`); }

const total = Object.values(issues).reduce((n, a) => n + a.length, 0);
let out = `# Daily SEO check\n\nChecked ${checked} pages (${redirects} size-redirect pages skipped). ${total ? `Found **${total}** things to fix.` : 'No problems found. 🎉'}\n`;
for (const [what, list] of Object.entries(issues).sort((a, b) => b[1].length - a[1].length)) {
  const u = [...new Set(list)];
  out += `\n### ${what} (${u.length})\n${u.slice(0, 15).map(x => `- ${x}`).join('\n')}${u.length > 15 ? `\n- …and ${u.length - 15} more` : ''}\n`;
}
out += '\nTips: fix product details in the admin Catalog tab; the pages rebuild every 3 hours.\n';
console.log(out);
