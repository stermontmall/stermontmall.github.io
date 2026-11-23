// Validate active Neon catalogue rows before generating indexable product pages.
const LEGACY_IMAGE_HOST = 'stermontmall.github.io';

export function auditProducts(products = []) {
  const errors = [];
  const warnings = [];
  const rows = Array.isArray(products) ? products : [];
  for (const product of rows) {
    const id = product?.id ?? product?.slug ?? '(unknown product)';
    const name = String(product?.name || product?.seo_name || id);
    if (!String(product?.seo_name || '').trim()) errors.push(id + ': missing seo_name');
    if (String(product?.seo_title || '').length > 60) errors.push(id + ': seo_title exceeds 60 characters');
    if (product?.category_id == null || product.category_id === '') errors.push(id + ': missing category_id');
    if (!Array.isArray(product?.images) || product.images.length === 0) errors.push(id + ': no product image reference');
    if (String(product?.seo_name || name).includes('\\')) errors.push(id + ': seo_name contains a stray backslash');
    if (Array.isArray(product?.images) && product.images.some(image => String(image || '').includes(LEGACY_IMAGE_HOST))) {
      warnings.push(id + ': uses a legacy product image host');
    }
  }
  return { count: rows.length, errors, warnings };
}
