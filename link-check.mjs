// Broken-link guard for every page of the site (no dependencies).
//   node link-check.mjs          -> exit 1 if a problem is found (used as a PR gate)
//   node link-check.mjs --warn   -> print the problems as warnings, exit 0 (used in the page rebuild)
// It looks at every href/src in every .html file and reports:
//   1. placeholder values that a generator forgot to fill in: undefined, null, NaN, [object Object], ${...}
//   2. internal links (relative, or on stermontarcade.co.ke) whose file does not exist in the repository
// External sites are not touched here; the weekly "Site audit" (Lychee) covers those.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix, extname } from 'node:path';

const ROOT = process.cwd();
const WARN = process.argv.includes('--warn');
const SKIP = new Set(['node_modules', '.git', '.github', 'mobile-shell', 'supabase', 'tools', 'scripts', 'github']);
const HOSTS = new Set(['stermontarcade.co.ke', 'www.stermontarcade.co.ke']);
const ATTR = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const PLACEHOLDER = /^(undefined|null|nan|\[object object\])$|\/(undefined|null)(\/|$|\.html)|\$\{|\{\{/i;

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* pages(p);
    else if (name.endsWith('.html')) yield p;
  }
}

function exists(urlPath) {
  const fs = join(ROOT, decodeURIComponent(urlPath).replace(/^\/+/, ''));
  if (existsSync(fs)) {
    if (statSync(fs).isDirectory()) return existsSync(join(fs, 'index.html'));
    return true;
  }
  return extname(fs) === '' && existsSync(fs + '.html');
}

const problems = [];
let checked = 0;
for (const file of pages(ROOT)) {
  const rel = relative(ROOT, file).split('\\').join('/');
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(ATTR)) {
    const raw = decode((m[1] ?? m[2] ?? '').trim());
    if (!raw || raw.startsWith('#')) continue;
    if (PLACEHOLDER.test(raw)) { problems.push(`${rel}: placeholder link "${raw.slice(0, 80)}"`); continue; }
    if (/^(mailto:|tel:|sms:|javascript:|data:|blob:|whatsapp:)/i.test(raw) || raw.startsWith('//')) continue;
    let path;
    if (/^https?:\/\//i.test(raw)) {
      let u; try { u = new URL(raw); } catch { problems.push(`${rel}: unparseable link "${raw.slice(0, 80)}"`); continue; }
      if (!HOSTS.has(u.hostname)) continue;
      path = u.pathname;
    } else {
      const clean = raw.split(/[?#]/)[0];
      path = clean.startsWith('/') ? clean : posix.normalize(posix.join('/', dirname(rel), clean));
    }
    checked++;
    if (!exists(path || '/')) problems.push(`${rel}: broken link ${path}`);
  }
}

const unique = [...new Set(problems)];
console.log(`link-check: ${checked} internal links checked, ${unique.length} problem(s)`);
for (const p of unique.slice(0, 200)) console.log(WARN ? `::warning::${p}` : `  ${p}`);
if (unique.length > 200) console.log(`  ... and ${unique.length - 200} more`);
process.exit(unique.length && !WARN ? 1 : 0);
