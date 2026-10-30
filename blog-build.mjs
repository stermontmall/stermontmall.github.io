// Stermont Arcade - keeps the blog index and sitemap.xml in step with the posts in /blog/.
// Runs from .github/workflows/blog-build.yml whenever a blog post is added or edited (no installs needed, Node 18+).
// Safe by design: it only rewrites the post list between the markers in blog/index.html and the /blog/ entries in sitemap.xml,
// it never touches product pages, and it writes nothing when nothing changed.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const START = '<!--BLOG-POSTS-START-->', END = '<!--BLOG-POSTS-END-->';
// A post goes under the first group whose keywords appear in its file name. Anything else lands in "More guides".
const GROUPS = [
  ['Shopping online', ['mpesa', 'delivery', 'order', 'shopping', 'payment', 'checkout']],
  ['Electronics and appliances', ['tv', 'fridge', 'washing', 'fryer', 'laptop', 'phone', 'solar', 'cooker', 'microwave', 'blender', 'appliance', 'appliances']],
  ['Pest control', ['bugs', 'cockroach', 'cockroaches', 'rat', 'mouse', 'mosquito', 'mosquitoes', 'termite', 'termites', 'pest', 'fumigation', 'ants', 'flies']]
];
const OTHER = 'More guides';
const today = new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };

if (!existsSync('blog')) { console.log('No blog folder - nothing to do.'); process.exit(0); }

// ---- read every published post ----
const posts = [];
for (const f of readdirSync('blog').filter(f => f.endsWith('.html') && f !== 'index.html').sort()) {
  const h = readFileSync(`blog/${f}`, 'utf8'), slug = f.replace(/\.html$/, '');
  if (/<meta name=["']robots["'] content=["'][^"']*noindex/i.test(h)) { console.log(`Skipping ${f} (noindex).`); continue; }
  const h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  if (!h1) { console.log(`Skipping ${f}: no <h1> heading found.`); continue; }
  const meta = re => { const m = h.match(re); return m ? (m[1] || m[2] || '') : ''; };
  const desc = unesc(meta(/<meta property=["']og:description["'] content=(?:"([^"]*)"|'([^']*)')/i) || meta(/<meta name=["']description["'] content=(?:"([^"]*)"|'([^']*)')/i));
  const published = (h.match(/"datePublished":"(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
  const modified = (h.match(/"dateModified":"(\d{4}-\d{2}-\d{2})/) || [])[1] || published;
  const tokens = slug.split('-');
  const group = (GROUPS.find(([, keys]) => keys.some(k => tokens.includes(k))) || [OTHER])[0];
  posts.push({ slug, loc: `${SITE}/blog/${f}`, title: unesc(h1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()), desc: clip(desc, 160), published, modified, group });
}
if (!posts.length) { console.log('No blog posts found - leaving index and sitemap alone.'); process.exit(0); }

// ---- blog/index.html: rewrite only the part between the markers ----
{
  const order = [...GROUPS.map(g => g[0]), OTHER];
  const html = order.map(g => {
    const list = posts.filter(p => p.group === g).sort((a, b) => (b.published || '').localeCompare(a.published || '') || a.title.localeCompare(b.title));
    return list.length ? `<h2>${esc(g)}</h2>\n` + list.map(p => `<div class="box"><a href="/blog/${p.slug}.html">${esc(p.title)}</a>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}</div>`).join('\n') : '';
  }).filter(Boolean).join('\n');
  const idx = readFileSync('blog/index.html', 'utf8');
  const a = idx.indexOf(START), b = idx.indexOf(END);
  if (a < 0 || b < a) console.log('blog/index.html has no post markers - leaving it alone.');
  else {
    const next = idx.slice(0, a + START.length) + '\n' + html + '\n' + idx.slice(b);
    if (next !== idx) { writeFileSync('blog/index.html', next); console.log(`Updated blog/index.html (${posts.length} posts).`); } else console.log('blog/index.html already up to date.');
  }
}

// ---- home page (index.html): rewrite only the guides strip between its markers (8 newest posts) ----
{
  const S = '<!--BLOG-STRIP-START-->', E = '<!--BLOG-STRIP-END-->';
  if (existsSync('index.html')) {
    const idx = readFileSync('index.html', 'utf8'), a = idx.indexOf(S), b = idx.indexOf(E);
    if (a < 0 || b < a) console.log('index.html has no guides-strip markers - leaving it alone.');
    else {
      const latest = [...posts].sort((x, y) => (y.published || '').localeCompare(x.published || '') || x.title.localeCompare(y.title)).slice(0, 8);
      const html = latest.map(p => `<a class="gcard" href="/blog/${p.slug}.html"><b>${esc(p.title)}</b>${p.desc ? `<span>${esc(clip(p.desc, 90))}</span>` : ''}</a>`).join('\n');
      const next = idx.slice(0, a + S.length) + '\n' + html + '\n' + idx.slice(b);
      if (next !== idx) { writeFileSync('index.html', next); console.log(`Updated the guides strip on index.html (${latest.length} posts).`); } else console.log('index.html guides strip already up to date.');
    }
  }
}

// ---- sitemap.xml: rewrite only the /blog/ entries ----
if (existsSync('sitemap.xml')) {
  const sm0 = readFileSync('sitemap.xml', 'utf8'), oldMod = {}, MARK = '@@BLOG@@';
  let first = true;
  let sm = sm0.replace(/[ \t]*<url>[\s\S]*?<\/url>\n?/g, blk => {
    const loc = (blk.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '';
    if (loc !== `${SITE}/blog/` && !loc.startsWith(`${SITE}/blog/`)) return blk;
    oldMod[loc] = (blk.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (first) { first = false; return MARK; }
    return '';
  });
  if (!sm.includes(MARK)) sm = sm.replace('</urlset>', MARK + '</urlset>');
  const blk = (loc, mod, freq, pr) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pr}</priority>\n  </url>\n`;
  const mods = posts.map(p => p.modified || oldMod[p.loc] || today);
  const entries = blk(`${SITE}/blog/`, [...mods].sort().pop(), 'weekly', '0.7') + posts.map((p, i) => blk(p.loc, mods[i], 'monthly', '0.6')).join('');
  sm = sm.replace(MARK, () => entries);
  if (sm !== sm0) { writeFileSync('sitemap.xml', sm); console.log('Updated sitemap.xml.'); } else console.log('sitemap.xml already up to date.');
}
