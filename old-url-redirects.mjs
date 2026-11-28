// Permanent forwards for old product addresses that Google and customers still use.
// The build deletes p/ and writes it again, so a redirect page added by hand is lost on the next build.
// To keep an old address working, add a line to data/old-url-redirects.csv instead: old_slug,target
// (target is /p/<slug>.html or /c/<slug>.html). This runs after all real pages are written and never overwrites one.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIST = 'data/old-url-redirects.csv';
const LINE = /^([a-z0-9-]+),(\/(?:p|c)\/[a-z0-9-]+\.html)$/;

export function parseRedirects(text) {
  const map = new Map();
  String(text).split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line === 'old_slug,target') return;
    const m = line.match(LINE);
    if (!m) throw new Error(`${LIST} line ${i + 1} is not "old_slug,/p|c/slug.html": ${line}`);
    if (map.has(m[1])) throw new Error(`${LIST} line ${i + 1} repeats ${m[1]}`);
    map.set(m[1], m[2]);
  });
  return map;
}

const refreshTarget = (html, site) => {
  const m = html.match(/<meta http-equiv="refresh" content="0; ?url=([^"]+)"/i);
  return m ? m[1].replace(site, '') : '';
};

// Follows other forwards to the page that really exists, so there are no chains or loops.
// Returns '' when the trail ends in a missing page.
function finalTarget(target, map, root, site) {
  const seen = new Set();
  while (target && !seen.has(target)) {
    seen.add(target);
    const file = join(root, target);
    if (existsSync(file)) {
      const next = refreshTarget(readFileSync(file, 'utf8'), site);
      if (!next) return target;
      target = next;
    } else target = map.get((target.match(/^\/p\/(.+)\.html$/) || [])[1]) || '';
  }
  return '';
}

export function writeOldRedirects(map, { root = '.', site }) {
  const result = { written: 0, kept: 0, fallback: [] };
  const pending = [];
  for (const [slug, wanted] of map) {
    // A live product (or a forward the build already made from the catalogue) always wins.
    if (existsSync(join(root, 'p', slug + '.html'))) { result.kept++; continue; }
    let target = finalTarget(wanted, map, root, site);
    if (!target) { target = '/c/'; result.fallback.push(slug); }   // product or category gone: show all categories, never a dead link
    pending.push([slug, target]);
  }
  for (const [slug, target] of pending) {
    const url = site + target;
    writeFileSync(join(root, 'p', slug + '.html'), `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${url}"><meta http-equiv="refresh" content="0;url=${url}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><p>This product moved. <a href="${url}">Continue</a>.</p></body></html>`);
    result.written++;
  }
  return result;
}
