// A sitemap should list only pages we want Google to index: no noindex pages, redirects,
// missing files or pages whose canonical points somewhere else.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://stermontarcade.co.ke';

export function belongsInSitemap(url, root = '.') {
  if (!url.startsWith(SITE + '/')) return false;
  let path = decodeURIComponent(url.slice(SITE.length));
  if (path.endsWith('/')) path += 'index.html';
  const file = join(root, path);
  if (!existsSync(file)) return false;
  if (!file.endsWith('.html')) return true;
  const html = readFileSync(file, 'utf8');
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) return false;
  if (/<meta\s+http-equiv=["']refresh["']/i.test(html)) return false;
  const canonical = (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [])[1];
  return !canonical || canonical === url;
}
