// Stermont Arcade - gives pest-control, nairobi, bulk-quote and 404 pages the mobile-shell look.
// Same page for everyone (visitors, Googlebot, WhatsApp): nothing is redirected, no text, title, heading, canonical or schema is touched.
// Idempotent (marker <!--stm-chrome-->); redirect stubs (meta refresh) are left alone.
// To undo: git revert the bot commit "Shell look on static pages".
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { addChrome } from './seo-shell-chrome.mjs';

const DIRS = ['pest-control'];
const FILES = ['nairobi.html', 'bulk-quote.html', '404.html'];

function walk(dir, out = []) {
  let names = [];
  try { names = readdirSync(dir); } catch (e) { return out; }
  for (const n of names) {
    const p = `${dir}/${n}`;
    let st; try { st = statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

const list = [...FILES, ...DIRS.flatMap(d => walk(d))];
let n = 0;
for (const f of list) {
  try {
    const s = readFileSync(f, 'utf8'), o = addChrome(s);
    if (o !== s) { writeFileSync(f, o); n++; }
  } catch (e) { console.log('skipped', f, e.message); }
}
console.log(`seo-shell-chrome-all: added the shell top bar and bottom nav to ${n} of ${list.length} pages`);
