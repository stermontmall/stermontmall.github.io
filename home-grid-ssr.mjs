// Safe build-time HTML for the homepage's JavaScript-hydrated product grid.
// Only explicit positive stock is eligible; the live shell replaces these fallback cards after hydration.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const isOwnedImage = value => typeof value === 'string' && /^https:\/\/(?:stermontarcade\.co\.ke|oewvtbnmyombbtggamor\.supabase\.co)\//i.test(value);

export function renderHomeGridFallback(products, { limit = 8 } = {}) {
  if (!Array.isArray(products) || !Number.isInteger(limit) || limit < 1) return '';
  return products
    .filter(p => p && p.name && Number(p.stock) > 0 && Number(p.price) > 0 && /^\/p\/[a-z0-9][a-z0-9-]*\.html$/.test(String(p.href || '')))
    .slice(0, limit)
    .map((p, index) => {
      const image = isOwnedImage(p.image)
        ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" ${index < 4 ? "loading=\"eager\"" : "loading=\"lazy\""} ${index === 0 ? "fetchpriority=\"high\"" : ""} decoding="async" style="width:100%;height:100%;object-fit:contain;background:#fff">`
        : '<span class="text-sm text-mute">Product details</span>';
      const price = Math.round(Number(p.price)).toLocaleString('en-KE');
      return `<li class="card ssr-product-card" data-ssr="true"><a href="${esc(p.href)}" aria-label="View ${esc(p.name)}" style="display:block;color:inherit;text-decoration:none">
        <div class="relative aspect-square grid place-items-center" style="background:#fff;overflow:hidden">${image}</div>
        <div class="p-2"><p class="text-xs leading-4 line-clamp-2 min-h-8">${esc(p.name)}</p><p class="mt-1"><span class="text-sale font-bold text-sm">KSh ${price}</span></p></div>
      </a></li>`;
    }).join('\n');
}
