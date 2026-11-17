// Category-page editorial enrichment: keep introductions useful and FAQs visible/schema-synchronised.
export function buildCategoryIntro(category, baseIntro = '') {
  const name = String(category?.name || 'products').trim();
  const examples = (category?.items || []).slice(0, 3).map(p => p.name).filter(Boolean);
  const exampleText = examples.length ? 'Examples currently listed include ' + examples.join(', ') + '.' : 'Check the live listings for the models and pack sizes currently available.';
  const opening = String(baseIntro || '').replace(/\s+/g, ' ').trim();
  const additions = [
    'Compare the exact product name, model or formulation rather than relying on a broad category label. Product titles and pack sizes can differ, so open each listing to review its full description, current price, images and any stated variant details.',
    'Think about the job the item needs to do, the quantity required and the specifications that matter in your setting. For equipment, check dimensions, capacity, power requirements and included accessories where those details are provided. For consumables, compare unit size and the intended application shown on the product information.',
    'Before placing an order, confirm availability, the final amount and the delivery fee for your town or county. Stermont Arcade accepts M-Pesa and arranges delivery across Kenya; delivery charges and dispatch timing are confirmed for the order before payment. If a listing does not answer an important question, contact the store before checkout.',
    exampleText + ' Use the product page as the source of truth for current listing details, and ask for clarification whenever a specification, compatibility point or intended use is not stated.'
  ];
  let text = opening || 'Browse the available ' + name.toLowerCase() + ' listings at Stermont Arcade.';
  for (const addition of additions) {
    if (text.split(/\s+/).filter(Boolean).length >= 135) break;
    text += ' ' + addition;
  }
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 165) text = words.slice(0, 160).join(' ').replace(/[.,;:]?$/, '.') ;
  return text;
}

export function buildCategoryFaq(category, existing = []) {
  const name = String(category?.name || 'this category').trim();
  const fallback = [
    ['How do I choose the right ' + name.toLowerCase() + ' product?', 'Start with the task you need to complete, then compare the exact product name, model, pack size and specifications shown on each listing. Open the product page and contact Stermont Arcade if a key detail is not stated.'],
    ['What should I compare before ordering?', 'Compare the listed price, quantity or pack size, model details, included accessories and any stated compatibility or use information. Do not assume two products are equivalent just because their names are similar.'],
    ['Can I confirm stock, price and delivery before paying?', 'Yes. Check the live product page and contact Stermont Arcade to confirm availability, the order total and the delivery fee for your location before making payment by M-Pesa.'],
    ['Do you deliver ' + name.toLowerCase() + ' products across Kenya?', 'Stermont Arcade arranges delivery across all 47 counties. The delivery fee and expected dispatch or transit timing are confirmed for your location before payment.']
  ];
  const valid = Array.isArray(existing) ? existing.filter(x => Array.isArray(x) && x.length >= 2 && x[0] && x[1]).slice(0, 4) : [];
  for (const item of fallback) {
    if (valid.length >= 4) break;
    if (!valid.some(x => x[0] === item[0])) valid.push(item);
  }
  return valid.slice(0, 4);
}
