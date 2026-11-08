// Guard: nothing on the site may send visitors through /classic.html again.
// History: /classic.html was the old 128 KB home page. After the mobile shell became the home page, the checkout and old links still went
// through it, so customers saw the old page (and waited for its catalog) before the shell. Now:
//   /checkout.html  = the checkout surface (opened inside the shell in a frame, never a landing page)
//   /classic.html   = a tiny forwarder for old bookmarks and shared links
// This test fails if a page or script links to /classic.html, if the shell opens it, or if the forwarder grows into a real page again.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'p', 'c', 'guides', 'blog', 'product-photos', 'assets', '.github']);
const ALLOWED = new Set(['classic.html', 'no-classic-hop.test.mjs', 'mobile-shell/shell.test.py']);   // the forwarder itself and the tests that exercise it
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f), st = statSync(p);
    if (st.isDirectory()) walk(p, out); else if (/\.(html|js|mjs|json|css|webmanifest)$/.test(f) && st.size < 3_000_000) out.push(p);
  }
  return out;
};

const offenders = walk('.').filter(f => !ALLOWED.has(f.replace(/^\.\//, ''))).filter(f => /classic\.html/.test(readFileSync(f, 'utf8')));
assert.deepEqual(offenders, [], 'these files still mention classic.html: ' + offenders.join(', '));

const stub = readFileSync('classic.html', 'utf8');
assert.ok(Buffer.byteLength(stub) < 3000, 'classic.html must stay a tiny forwarder (under 3 KB), it is ' + Buffer.byteLength(stub));
assert.ok(/<meta name="robots" content="noindex, follow">/.test(stub) && /rel="canonical" href="https:\/\/stermontarcade\.co\.ke\/"/.test(stub), 'forwarder must be noindex with the home page as canonical');
assert.ok(/l\.replace\(t\)/.test(stub) && /<noscript><meta http-equiv="refresh"/.test(stub), 'forwarder must redirect with and without JavaScript');
assert.ok(!/<script[^>]+src=/.test(stub), 'forwarder must not load any script files');

assert.ok(existsSync('checkout.html'), 'checkout.html must exist');
const shell = readFileSync('mobile-shell/app.js', 'utf8');
assert.ok(shell.includes("f.src = '/checkout.html?checkout=1'"), 'the shell must open /checkout.html for checkout');
assert.ok(/noindex, follow/.test(readFileSync('checkout.html', 'utf8')), 'checkout.html must be noindex');
console.log('OK: no page or script goes through /classic.html; forwarder is ' + Buffer.byteLength(stub) + ' bytes');
