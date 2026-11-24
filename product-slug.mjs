// Slug policy for NEW product drafts only. Existing published catalogue slugs are never rewritten.
const FILLER = new Set(['a', 'an', 'and', 'for', 'the', 'with', 'of', 'to']);
const SIZE_UNITS = new Set(['ml', 'l', 'litre', 'litres', 'ltr', 'kg', 'g', 'mg', 'pcs', 'pc', 'pack', 'packs', 'w', 'kw', 'gb', 'tb', 'mah', 'inch', 'inches', 'cm', 'mm']);
const tokens = value => String(value || '').normalize('NFKD').toLowerCase().match(/[a-z0-9]+/g) || [];

export function slugifyNewProduct(name, unit = '') {
  const nameTokens = tokens(name).filter(word => !FILLER.has(word));
  const unitTokens = tokens(unit).filter(word => !FILLER.has(word));
  const detectedSize = nameTokens.filter(word => /\\d/.test(word) || SIZE_UNITS.has(word));
  const packTokens = [...new Set(unitTokens.length ? unitTokens : detectedSize)];
  const allUnique = [...new Set([...nameTokens, ...unitTokens])];
  const descriptive = allUnique.filter(word => !packTokens.includes(word));
  const selected = [...descriptive.slice(0, Math.max(0, 7 - packTokens.length)), ...packTokens].slice(0, 7);
  if (selected.length) return selected.join('-');
  return tokens(name).join('-').slice(0, 70).replace(/-+$/, '');
}
