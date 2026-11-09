// Guard for the inline phone redirect at the top of every /p/ and /c/ page (<!--stm-early--> script, written by seo-shell-chrome.mjs).
// Policy the owner accepted on 2026-11-08: a real phone-width visitor (never a crawler / link-preview bot) is sent to the shell
// (/?product=<slug or size slug>, /?cat=<slug>, /?tab=categories); old ?shell=1 links do the same at any width; ?classic=1 / ?noshell=1 opt out.
// The page the crawler sees stays the static page. This test runs the REAL inline script from a built page in a fake browser (node:vm), no network.
// Run: node seo-shell-early.test.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(fileURLToPath(import.meta.url));
const grab = (html) => { const m = /<!--stm-early--><script>([\s\S]*?)<\/script>/.exec(html); return m ? m[1] : null; };
const SCRIPT = grab(readFileSync(join(ROOT, 'p', 'abasi-5-ec.html'), 'utf8'));
let n = 0, bad = 0;
const check = (name, ok, extra) => { n++; if (!ok) { bad++; console.log('FAIL ' + name + (extra !== undefined ? '  [' + JSON.stringify(extra) + ']' : '')); } };
check('a built product page carries the early redirect script', !!SCRIPT);

// Run the script as a browser would: returns { to, hidden } (to = address passed to location.replace, or null).
function run({ path, search = '', hash = '', ua, width }) {
  const out = { to: null, hidden: false };
  const ctx = {
    location: { pathname: path, search, hash, replace: (u) => { out.to = u; } },
    navigator: { userAgent: ua },
    innerWidth: width,
    document: { documentElement: { style: { set visibility(v) { out.hidden = v === 'hidden'; } } } },
  };
  vm.runInNewContext(SCRIPT, ctx);
  return out;
}
const PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const BOTS = {
  Googlebot: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Google-InspectionTool': 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  WhatsApp: 'WhatsApp/2.23.20.0 A',
  Facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  Telegram: 'TelegramBot (like TwitterBot)',
  Lighthouse: 'Mozilla/5.0 (Linux; Android 11) Chrome-Lighthouse',
  HeadlessChrome: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0 Safari/537.36',
};

// phone-width, normal browser: sent to the shell
let r = run({ path: '/p/abasi-5-ec.html', ua: PHONE, width: 390 });
check('phone on /p/<slug>.html -> /?product=<slug>, page hidden while it leaves', r.to === '/?product=abasi-5-ec' && r.hidden, r);
r = run({ path: '/p/abasi-5-ec.html', hash: '#abasi-5-ec-250-ml', ua: ANDROID, width: 412 });
check('phone with a size in the address -> /?product=<size slug>', r.to === '/?product=abasi-5-ec-250-ml', r);
r = run({ path: '/p/abasi-5-ec.html', ua: PHONE, width: 820 });
check('820px wide (tablet) still goes to the shell', r.to === '/?product=abasi-5-ec', r);
r = run({ path: '/c/herbicides.html', ua: PHONE, width: 390 });
check('phone on /c/<slug>.html -> /?cat=<slug>', r.to === '/?cat=herbicides', r);
r = run({ path: '/c/index.html', ua: PHONE, width: 390 });
check('phone on /c/index.html -> /?tab=categories', r.to === '/?tab=categories', r);
r = run({ path: '/c/', ua: PHONE, width: 390 });
check('phone on /c/ -> /?tab=categories', r.to === '/?tab=categories', r);

// old shared links with ?shell=1 open the shell at any width
r = run({ path: '/p/abasi-5-ec.html', search: '?shell=1', ua: DESKTOP, width: 1280 });
check('old ?shell=1 link opens the shell even on a wide screen', r.to === '/?product=abasi-5-ec', r);
r = run({ path: '/p/abasi-5-ec.html', search: '?a=1&shell=1', hash: '#abasi-5-ec-100-ml', ua: DESKTOP, width: 1280 });
check('?shell=1 after another parameter works too, size kept', r.to === '/?product=abasi-5-ec-100-ml', r);

// nobody who should see the static page is redirected
r = run({ path: '/p/abasi-5-ec.html', ua: DESKTOP, width: 1280 });
check('desktop keeps the static product page (clean link, no redirect)', r.to === null && !r.hidden, r);
for (const [name, ua] of Object.entries(BOTS)) {
  for (const width of [390, 1280]) {
    for (const search of ['', '?shell=1']) {
      r = run({ path: '/p/abasi-5-ec.html', search, ua, width });
      check(`${name} (${width}px${search ? ', ' + search : ''}) is never redirected and the page is not hidden`, r.to === null && !r.hidden, r);
    }
  }
  r = run({ path: '/c/herbicides.html', ua, width: 390 });
  check(`${name} is not redirected on a category page`, r.to === null && !r.hidden, r);
}
r = run({ path: '/p/abasi-5-ec.html', search: '?classic=1', ua: PHONE, width: 390 });
check('?classic=1 keeps the static page on a phone', r.to === null, r);
r = run({ path: '/p/abasi-5-ec.html', search: '?noshell=1&shell=1', ua: PHONE, width: 390 });
check('?noshell=1 wins over ?shell=1', r.to === null, r);

// safety: odd addresses are never turned into a redirect
r = run({ path: '/p/abasi-5-ec.html', hash: '#<script>', ua: PHONE, width: 390 });
check('a hash with unsafe characters is not used as a redirect target', r.to === null, r);
r = run({ path: '/p/a/b.html', ua: PHONE, width: 390 });
check('a nested path is not matched', r.to === null, r);
r = run({ path: '/about.html', ua: PHONE, width: 390 });
check('other pages (/about.html) are left alone', r.to === null, r);
r = run({ path: '/p/abasi-5-ec.html', ua: '', width: 0 });
check('no width information (width 0) and no ?shell=1 -> no redirect', r.to === null, r);

// consistency: every generated page carries the SAME script as the sample, so a rebuild cannot leave an old variant behind
for (const dir of ['p', 'c']) {
  let files = [];
  try { files = readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.html')); } catch (e) {}
  let stale = [];
  for (const f of files) {
    const html = readFileSync(join(ROOT, dir, f), 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;   // redirect stubs for extra pack sizes
    const s = grab(html);
    if (s !== null && s !== SCRIPT) stale.push(dir + '/' + f);   // pages without the marker are not product/category pages; only an OLD variant is a defect
  }
  check(`every ${dir}/ page has no OLD variant of the early script (${files.length} files)`, stale.length === 0, stale.slice(0, 5));
}
console.log(bad ? `${n - bad}/${n} passed, ${bad} FAILED` : `OK: ${n} checks, 0 violations`);
process.exit(bad ? 1 : 0);
