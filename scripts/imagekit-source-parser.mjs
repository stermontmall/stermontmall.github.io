// Resolve image URLs from supplier product JSON APIs (WordPress/WooCommerce and similar).
export function extractJsonImageCandidates(data, baseUrl) {
  const out = [];
  const add = (value) => {
    if (typeof value !== 'string' || !value.trim()) return;
    try {
      const url = new URL(value.trim(), baseUrl);
      if (url.protocol === 'https:' && !out.includes(url.href)) out.push(url.href);
    } catch { /* ignore non-URLs */ }
  };
  const imageKeys = /^(image|images|photo|photos|thumbnail|featured_image|featuredimage|product_image|product_images|source_url|contenturl|original_image)$/i;
  const nestedImageKeys = /^(src|url|href|source_url|contenturl|large|full|original)$/i;
  const walk = (value, imageContext = false) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && imageContext) add(item);
        else walk(item, imageContext);
      }
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const isImageField = imageKeys.test(key);
      if (typeof child === 'string') {
        if (isImageField || (imageContext && nestedImageKeys.test(key))) add(child);
      } else if (child && typeof child === 'object') {
        walk(child, imageContext || isImageField);
      }
    }
  };
  walk(data);
  return out;
}
