// Keeps old product addresses forwarding after a rebuild. generate-products.mjs deletes p/ and writes it again,
// so redirect pages committed by hand disappear on the next run. List them in legacy-redirects.json instead:
//   { "old-slug": "/p/new-slug.html" }  or  { "old-slug": "/c/category.html" }
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://stermontarcade.co.ke';
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const TARGET = /^\/(p|c)\/[a-z0-9][a-z0-9-]*\.html$/;
const isRedirect = html => /http-equiv=["']refresh["']/i.test(html);

// Follow redirect pages to the final page, so an old address never needs two hops. Returns null if there is none.
function finalTarget(root, target) {
  for (let hop = 0; hop < 5; hop++) {
    if (!TARGET.test(target)) return null;
    const file = join(root, target);
    if (!existsSync(file)) return null;
    const html = readFileSync(file, 'utf8');
    if (!isRedirect(html)) return target;
    target = (html.match(/<link rel="canonical" href="https:\/\/stermontarcade\.co\.ke(\/[^"]+)"/) || [])[1] || '';
  }
  return null;
}

export function redirectPage(target) {
  const url = SITE + target;
  const link = target.startsWith('/p/') ? `${SITE}/?product=${target.slice(3, -5)}` : url;
  return `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${url}"><meta http-equiv="refresh" content="0;url=${url}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><p>This page moved. <a href="${link}">Continue</a>.</p></body></html>`;
}

// Never overwrites a page the build has already written: a live product always wins over an old redirect.
export function writeLegacyRedirects(map, root = '.') {
  const result = { written: 0, live: 0, skipped: [] };
  for (const [slug, target] of Object.entries(map)) {
    if (!SLUG.test(slug)) { result.skipped.push(slug); continue; }
    const file = join(root, 'p', `${slug}.html`);
    if (existsSync(file)) { result.live++; continue; }
    const to = finalTarget(root, target);
    if (!to) { result.skipped.push(slug); continue; }
    writeFileSync(file, redirectPage(to));
    result.written++;
  }
  return result;
}
