// Guard: customer/staff-facing product links must always open the mobile shell.
// SEO-only /p/<slug>.html surfaces (canonical, og:url, sitemap, JSON-LD,
// breadcrumbs and seo-links crawl links) are intentionally preserved.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const SKIP = new Set(['.git', 'node_modules', 'p', 'c', 'guides', 'blog', 'product-photos', 'assets', 'services', 'pest-control']);
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name), st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (/\.(html|js|mjs|json|css|webmanifest)$/.test(name) && st.size < 3_000_000) out.push(path);
  }
  return out;
};
const files = walk('.');
const offenders = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, index) => {

      if (/(?:href\s*=\s*["'][^"']*\/p\/|Link:\s*[^\n<]*\/p\/|href\s*=\s*["'][^"']*\/classic\.html)/i.test(html)) {
    if (!/(?:href\s*=|\.href\s*=|Link:\s*|navigator\.share|window\.open)[^\n]*\/p\//i.test(line)) return;
    // Internal SEO document fetches and explicitly defined Google crawl surfaces are not customer links.
    if (file === 'index.html' && line.includes('href="/p/')) return; // owner-approved seo-links crawl block, not the visible product grid
    if (file === 'generate-products.mjs' && /canonical|og:url|crumbLd|jsonLd|itemListElement|sitemap|preload|const path\s*=|const from\s*=|const to\s*=|redirect|seo-links/i.test(line)) return;
    if (file === 'storefront-live.js' && /function purl\(|fetch\(purl\(/.test(line)) return;
    if (file === 'seo-related-fill.mjs' && line.includes('existing.match')) return; // only reads old SEO related anchors for de-duplication
    if (['seo-pest/blog-build.mjs', 'blog-write.mjs', 'blog-build.mjs', 'services/build-services.mjs'].includes(file) && line.includes('shellProductLink')) return;
    if (/seo-links|seo-links\.mjs|seo-links\.js/.test(file)) return;
    if (/no-static-share-links\.test\.mjs/.test(file)) return;
    offenders.push(file + ':' + (index + 1) + ': ' + line.trim().slice(0, 220));
  });
}
assert.deepEqual(offenders, [], 'Human-facing links still point to static product pages:\n' + offenders.join('\n'));

const shellProductLink = createRequire(import.meta.url)('./product-links.js');
assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), 'https://stermontarcade.co.ke/?product=premise-200-sc-termiticide-50-ml');
const homepage = readFileSync('index.html', 'utf8');
const homeGrid = (homepage.match(/<ul id="grid"[\s\S]*?<\/ul>/) || [])[0] || '';
assert.ok(homeGrid.includes('https://stermontarcade.co.ke/?product='), 'homepage SSR cards must expose shell product URLs');
assert.doesNotMatch(homeGrid, /href="\/p\//, 'homepage SSR cards must not expose static product URLs');
assert.ok(homepage.includes('<!-- seo-links:start -->') && homepage.includes('<!-- seo-links:end -->'), 'homepage SEO crawl links must remain present');
const helper = readFileSync('product-links.js', 'utf8');
assert.match(helper, /function shellProductLink\(slug\)/, 'shared shellProductLink helper must exist');
assert.match(helper, /\?product=/, 'helper must generate ?product= links');
const generator = readFileSync('generate-products.mjs', 'utf8');
for (const marker of ['href="${shellProductLink(sl(p.id))}"', '`Link: ${shellProductLink(sl(p.id))}`', '${shellProductLink(v.slug || p.slug || p.id)}']) {
  assert.ok(generator.includes(marker), 'product generator must use shellProductLink for: ' + marker);
}
assert.match(readFileSync('site-links.js', 'utf8'), /shellProductLink/, 'share/copy controls must use shell links');
assert.match(readFileSync('mobile-shell/app.js', 'utf8'), /const productUrl = .*shellProductLink/, 'mobile shell share URL must use shellProductLink');
assert.match(readFileSync('storefront-live.js', 'utf8'), /Link: ' \+ shareProductUrl/, 'storefront WhatsApp prefill must use shell links');
assert.match(readFileSync('home-grid-ssr.mjs', 'utf8'), /\\?product=/, 'homepage SSR cards must accept shell links');
assert.match(readFileSync('seo-related-fill.mjs', 'utf8'), /shellProductLink/, 'related-product generator must use shell links');
assert.match(readFileSync('seo-pest/blog-build.mjs', 'utf8'), /shellProductLink/, 'hand-written blog generator must use shell links');
assert.match(readFileSync('blog-write.mjs', 'utf8'), /shellProductLink/, 'AI blog generator must use shell links');
assert.match(readFileSync('blog-build.mjs', 'utf8'), /normalizePostProductLinks/, 'existing published blog posts must be normalized without touching SEO metadata');
assert.match(readFileSync('seo-kenya.mjs', 'utf8'), /shellProductLink\\(i\\.slug\\)/, 'price guide generator must use shell links');
assert.match(readFileSync('services/build-services.mjs', 'utf8'), /shellProductLink/, 'service page CTAs must use shell links');
assert.match(readFileSync('recent-orders.js', 'utf8'), /shellProductLink/, 'recent-order shortcuts must use shell links');
assert.match(readFileSync('wa-float.js', 'utf8'), /shellProductLink/, 'floating WhatsApp messages must use shell links');
assert.match(readFileSync('product-trust.js', 'utf8'), /shellProductLink/, 'product trust WhatsApp messages must use shell links');
assert.match(readFileSync('cat-feel.js', 'utf8'), /\\?product=/, 'category enhancements must recognise shell product links');
assert.match(readFileSync('kili-pages.js', 'utf8'), /\\?product=/, 'product search must recognise shell product links');
const briefs = readFileSync('blog-topics.json', 'utf8');
assert.doesNotMatch(briefs, /"\/p\/[^"]+\.html"/, 'blog/guide product CTAs must not use static product URLs');
assert.ok(existsSync('no-classic-hop.test.mjs'), 'classic-hop guard must remain installed');
if (process.env.STM_CHECK_GENERATED_PRODUCT_PAGES === '1') {
  let scanned = 0;
  const generatedDirs = ['p', 'c', 'guides', 'blog'];
  const generatedOffenders = [];
  for (const dir of generatedDirs) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter(name => name.endsWith('.html'))) {
      const file = join(dir, name);
      let html = readFileSync(file, 'utf8');
      // Keep SEO-only /p/ references intact while inspecting the customer-visible page body.
      html = html.replace(/<head\b[\s\S]*?<\/head>/gi, '')
        .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<nav[^>]*class=["'][^"']*\bbc\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi, '');
      try { html = decodeURIComponent(html.replace(/&amp;/g, '&')); } catch {}
      scanned++;
      if (/(?:href\s*=\s*["'][^"']*\/p\/|Link:\s*[^\n<]*\/p\/|href\s*=\s*["'][^"']*\/classic\.html)/i.test(html)) {
        generatedOffenders.push(file);
      }
    }
  }
  assert.deepEqual(generatedOffenders, [], 'Generated customer-visible pages still emit static product/classic links: ' + generatedOffenders.join(', '));
  console.log('OK: inspected ' + scanned + ' generated product/category/guide/blog pages; no static human-facing product links.');
}
console.log('OK: human-facing product links use shellProductLink; SEO-only /p/ surfaces remain allowlisted.');
