// Extract the visible long-form product description from current and legacy generated page layouts.
// Current catalogue pages use multiple .product-description-section blocks inside .product-description.
// Older pages used a .desc container. Navigation, tabs and structured data are deliberately excluded.
export function extractProductDescriptionText(html) {
  const source = String(html || '');
  const sections = [...source.matchAll(/<section\b(?=[^>]*\bclass=["'][^"']*\bproduct-description-section\b[^"']*["'])[^>]*>([\s\S]*?)<\/section>/gi)]
    .map(match => match[1]);
  let body = sections.length ? sections.join(' ') : '';
  if (!body) {
    const legacy = source.match(/<(?:div|section)\b(?=[^>]*\bclass=["'][^"']*\bdesc\b[^"']*["'])[^>]*>([\s\S]*?)<\/(?:div|section)>/i);
    body = legacy?.[1] || '';
  }
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&(?:amp|lt|gt|quot|#\d+|#x[\da-f]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
