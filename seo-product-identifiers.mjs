// Optional manufacturer identifiers for Product structured data.
// Only publish a GTIN when it is numeric, has a supported length and a valid check digit.
// MPN is emitted only when explicitly supplied in the catalogue; never infer it from our SKU.
export function productIdentifiers(product = {}) {
  const out = {};
  const raw = String(product.gtin ?? '').replace(/[\s-]/g, '');
  if (/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(raw)) {
    const digits = raw.split('').map(Number);
    const check = digits.pop();
    let sum = 0;
    for (let i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
      sum += digits[i] * (pos % 2 === 0 ? 3 : 1);
    }
    if ((10 - (sum % 10)) % 10 === check) out['gtin' + raw.length] = raw;
  }
  const mpn = String(product.mpn ?? '').trim();
  if (mpn && mpn.length <= 70) out.mpn = mpn;
  return out;
}
