// Guard: customer/staff-facing product links must always open the mobile shell.
// SEO-only /p/<slug>.html surfaces (canonical, og:url, sitemap, JSON-LD,
// breadcrumbs and seo-links crawl links) are intentionally preserved.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
    if (!/(?:href\s*=|\.href\s*=|Link:\s*|navigator\.share|window\.open)[^\n]*\/p\//i.test(line)) return;
    // Internal SEO document fetches and explicitly defined Google crawl surfaces are not customer links.
    if (file === 'index.html' && line.includes('href="/p/')) return; // owner-approved seo-links crawl block, not the visible product grid
    if (file === 'generate-products.mjs' && /canonical|og:url|crumbLd|jsonLd|itemListElement|sitemap|preload|const path\s*=|const from\s*=|const to\s*=|redirect|seo-links/i.test(line)) return;
    if (file === 'storefront-live.js' && /function purl\(|fetch\(purl\(/.test(line)) return;
    if (['seo-pest/blog-build.mjs', 'blog-write.mjs', 'services/build-services.mjs'].includes(file) && line.includes('shellProductLink')) return;
    if (/seo-links|seo-links\.mjs|seo-links\.js/.test(file)) return;
    if (/no-static-share-links\.test\.mjs/.test(file)) return;
    offenders.push(file + ':' + (index + 1) + ': ' + line.trim().slice(0, 220));
  });
}
assert.deepEqual(offenders, [], 'Human-facing links still point to static product pages:\n' + offenders.join('\n'));

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
console.log('OK: human-facing product links use shellProductLink; SEO-only /p/ surfaces remain allowlisted.');
