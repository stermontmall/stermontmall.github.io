// Stermont Arcade - gives every blog post and the blog index the mobile-shell top bar and bottom nav (same page for everyone, no redirect).
// Imported by blog-build.mjs, so it runs from .github/workflows/blog-build.yml (which commits blog/*.html) on every blog change and every manual run.
// Only adds the marker, a small style and <script src="/shell-chrome.js?v=2" defer>; no text, title, heading, canonical or schema is touched. Idempotent.
// To undo: remove the import line at the top of blog-build.mjs; pages keep the bar until it is reverted by hand or by git revert.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { addChrome } from './seo-shell-chrome.mjs';

try {
  let n = 0, total = 0;
  for (const f of readdirSync('blog').filter(f => f.endsWith('.html'))) {
    total++;
    const p = `blog/${f}`, s = readFileSync(p, 'utf8'), o = addChrome(s);
    if (o !== s) { writeFileSync(p, o); n++; }
  }
  console.log(`seo-blog-chrome: added the shell top bar and bottom nav to ${n} of ${total} blog pages`);
} catch (e) { console.log('seo-blog-chrome skipped:', e.message); }
