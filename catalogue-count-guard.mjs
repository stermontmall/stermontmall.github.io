// Prevent a destructive product-page rebuild when the source catalogue unexpectedly collapses.
import { readFileSync } from 'node:fs';

export function builtProductCount(pagesJson) {
  try {
    const pages = typeof pagesJson === 'string' ? JSON.parse(pagesJson) : pagesJson;
    if (!pages || typeof pages !== 'object' || Array.isArray(pages)) return 0;
    return Object.keys(pages).filter(path => /^\/p\/[^?#]+\.html$/.test(path)).length;
  } catch {
    return 0;
  }
}

export function checkCatalogueCount({ active = 0, baseline = 0, allowSmall = false } = {}) {
  const a = Number(active) || 0;
  const b = Number(baseline) || 0;
  if (allowSmall || b <= 5) return { ok: true, active: a, baseline: b };
  return { ok: a >= Math.ceil(b / 2), active: a, baseline: b };
}

// The guard is also imported by CI tests. In workflow execution, explicit counts may
// be supplied through environment variables; absent a baseline, do not invent one.
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const active = Number(process.env.ACTIVE_PRODUCT_COUNT || 0);
  const baseline = Number(process.env.CATALOGUE_BASELINE || 0);
  const allowSmall = process.env.ALLOW_SMALL_CATALOGUE === '1';
  const result = checkCatalogueCount({ active, baseline, allowSmall });
  if (!result.ok) {
    console.error(`Refusing product-page rebuild: ${result.active} active products is below half the ${result.baseline}-product baseline.`);
    process.exitCode = 1;
  } else {
    console.log(`Catalogue count guard passed (active: ${result.active}; baseline: ${result.baseline}).`);
  }
}
