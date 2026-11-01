// Stermont Arcade - keep blog search titles concise without changing article headings or content.
// Runs before the blog index/sitemap rebuild. It only edits <title>, og:title and twitter:title.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const BRAND = ' | Stermont Arcade';
const MAX_TITLE = 70;
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
  const base = current.endsWith(BRAND) ? current.slice(0, -BRAND.length).trim() : current;
  const title = clip(base, MAX_TITLE - BRAND.length) + BRAND;
  if (title.length <= MAX_TITLE && title !== current) {
    const safe = encode(title);
    let next = before.replace(m[0], '<title>' + safe + '</title>');
    next = next.replace(/(<meta\s+property=["']og:title["']\s+content=["'])[^"']*(["'])/i, '$1' + safe + '$2');
    next = next.replace(/(<meta\s+name=["']twitter:title["']\s+content=["'])[^"']*(["'])/i, '$1' + safe + '$2');
    if (next !== before) { writeFileSync(path, next); changed++; }
  }
}
console.log('Blog SEO titles: updated ' + changed + ' page(s); max title length ' + MAX_TITLE + '.');
