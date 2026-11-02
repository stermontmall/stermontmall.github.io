// Stermont Arcade - keep blog search titles concise without changing article headings or content.
// Runs before the blog index/sitemap rebuild. It only edits <title>, og:title and twitter:title.
// MAX_TITLE must match the SEO Doctor title check (25-65 characters, see seo-doctor.js).
// If "Title | Stermont Arcade" is too long, the brand is dropped rather than cutting the title mid-sentence.
// A title cut short by an older run (ends with "…") is restored from the page's own <h1>.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const BRAND = ' | Stermont Arcade';
const MAX_TITLE = 65;
const MIN_TITLE = 25;
const clip = (value, max) => {
  const s = String(value || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  let out = s.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[|,:;–-]+$/, '').trim();
  return out + '…';
};
const decode = s => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const encode = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
let changed = 0;
for (const file of readdirSync('blog').filter(x => x.endsWith('.html') && x !== 'index.html')) {
  const path = 'blog/' + file;
  const before = readFileSync(path, 'utf8');
  if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(before)) continue;
  const m = before.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) continue;
  const current = decode(m[1]);
  let base = current.endsWith(BRAND) ? current.slice(0, -BRAND.length).trim() : current;
  if (base.endsWith('…')) {
    const h = before.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h ? decode(h[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
    if (h1.length >= MIN_TITLE) base = h1;
  }
  let title = base + BRAND;
  if (title.length > MAX_TITLE) title = base.length <= MAX_TITLE ? base : clip(base, MAX_TITLE);
  if (title.length >= MIN_TITLE && title.length <= MAX_TITLE && title !== current) {
    const safe = encode(title);
    let next = before.replace(m[0], '<title>' + safe + '</title>');
    next = next.replace(/(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(["'])/i, '$1' + safe + '$2');
    next = next.replace(/(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(["'])/i, '$1' + safe + '$2');
    if (next !== before) { writeFileSync(path, next); changed++; }
  }
}
console.log('Blog SEO titles: updated ' + changed + ' page(s); max title length ' + MAX_TITLE + '.');
