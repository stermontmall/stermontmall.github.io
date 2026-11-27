// A sitemap must only list pages we ask Google to index: not noindex pages, and not pages whose canonical points elsewhere.
export function isIndexablePage(html, url) {
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  if (robots && /noindex/i.test(robots[1])) return false;
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return !canonical || canonical[1] === url;
}
