// Stermont Arcade - renders a catalogue description as semantic sections (used by generate-products.mjs).
// Layout goal (owner request 2026-11-09, modelled on the section order of a well-organised product page):
//   Product overview -> Key features -> Specifications -> Uses -> How to use -> Before you start -> Safety -> Storage -> FAQs -> Ordering.
// Fix 2026-11-09: the text that follows an uppercase label (KEY FEATURES, HOW TO USE ...) now keeps that label's heading.
// Before, only the last label kept it and every other section was rendered as a generic "Product information" heading.
// Descriptions without labels render exactly as before (overview + details paragraphs); no heading is ever guessed from ordinary words.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Only explicit uppercase section labels match. Never ordinary words such as "used", "order" or "safety" inside sentences.
const LABELS = [
  ['Product overview', /(?:^|\s)(?:PRODUCT SUMMARY|PRODUCT OVERVIEW)\s*:?\s*/g],
  ['Key features & benefits', /(?:^|\s)KEY PRODUCT FEATURES\s*:?\s*|(?:^|\s)KEY FEATURES(?:\s*&\s*BENEFITS)?\s*:?\s*/g],
  ['Specifications & product details', /(?:^|\s)SPECIFICATIONS\s*:?\s*/g],
  ['Uses & applications', /(?:^|\s)WHERE IT HELPS\s*:?\s*|(?:^|\s)APPLICATION(?:S)?\s*&?\s*USE\s*:?\s*/g],
  ['Application & dosage guidelines', /(?:^|\s)APPLICATION\s*&\s*DOSAGE GUIDELINES\s*:?\s*/g],
  ['How to use', /(?:^|\s)HOW TO USE(?: IT)?\s*:?\s*|(?:^|\s)DIRECTIONS FOR USE\s*:?\s*/g],
  ['Before you start', /(?:^|\s)BEFORE YOU START\s*:?\s*/g],
  ['Safety information', /(?:^|\s)SAFETY(?:\s+AND\s+RESPONSIBLE\s+HANDLING|\s+INFORMATION|\s+PRECAUTIONS|\s+PROTOCOLS(?:\s*&\s*PRECAUTIONS)?)?\s*:?\s*/g],
  ['Storage & handling', /(?:^|\s)STORAGE(?:\s*(?:&|AND)\s*HANDLING|\s+AND\s+DISPOSAL)?\s*:?\s*/g],
  ['Buying guide', /(?:^|\s)VEHICLE-SPECIFIC BUYING GUIDE\s*|(?:^|\s)BUYING GUIDE\s*:?\s*/g],
  ['Buying notes', /(?:^|\s)(?:IMPORTANT )?BUYING NOTES\s*:?\s*/g],
  ['Important notes', /(?:^|\s)IMPORTANT NOTES\s*:?\s*/g],
  ['Frequently asked questions', /(?:^|\s)FREQUENTLY ASKED QUESTIONS\s*|(?:^|\s)FAQS?\s*/g],
  ['Vehicle enquiry & next steps', /(?:^|\s)VEHICLE ENQUIRY\s*(?:&|AND)\s*NEXT STEPS\s*:?\s*/g],
  ['Ordering & delivery', /(?:^|\s)ORDERING(?:\s*&\s*DELIVERY)?\s*:?\s*|(?:^|\s)ORDER\s*:?\s*/g]
];

// "Question? Answer. Question? Answer." run together in one paragraph -> one block per question.
export function splitFaq(body) {
  const sentences = String(body).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
  const items = []; let cur = null;
  for (const s of sentences) {
    if (/\?$/.test(s)) { cur = { q: s, a: [] }; items.push(cur); }
    else if (cur) cur.a.push(s);
    else return null;                       // text before the first question: not a clean Q&A list, keep it as plain text
  }
  return items.length >= 2 && items.every(i => i.a.length) ? items.map(i => ({ q: i.q, a: i.a.join(' ') })) : null;
}

function renderBody(body, heading) {
  if (heading === 'Frequently asked questions') {
    const faq = splitFaq(body);
    if (faq) return faq.map(i => '<p><strong>' + esc(i.q) + '</strong><br>' + esc(i.a) + '</p>').join('');
  }
  const startsWithBullet = /^\s*[•●▪]/.test(body);
  const pieces = body.split(/\s*[•●▪]\s*/).map(x => x.trim()).filter(Boolean);
  if (pieces.length > 1 || (startsWithBullet && pieces.length)) {
    // Text before the first bullet is an intro paragraph; when the body starts with a bullet there is no intro (the old code turned the first bullet into a paragraph).
    const lead = startsWithBullet ? '' : pieces.shift();
    return (lead ? '<p>' + esc(lead) + '</p>' : '') + '<ul>' + pieces.map(x => '<li>' + esc(x.replace(/^[-–]\s*/, '')) + '</li>').join('') + '</ul>';
  }
  return body.split(/\n+/).map(x => x.trim()).filter(Boolean).map(line =>
    /^[-–•●▪]\s*/.test(line)
      ? '<ul><li>' + esc(line.replace(/^[-–•●▪]\s*/, '')) + '</li></ul>'
      : '<p>' + esc(line) + '</p>'
  ).join('');
}

export function productDescriptionHtml(source) {
  // Remove generic buying-guide boilerplate; retain the product-specific copy.
  const raw = String(source || '')
    // Older car records stored escaped newline characters (\\n) instead of real line breaks.
    // Decode them before heading detection so vehicle section labels become real headings.
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/\bundefined\b/gi, '')
    .replace(/\s*Search phrases relevant to this advert include[\s\S]*$/i, '')
    .replace(/\s*PRODUCT BUYING GUIDE:[\s\S]*$/i, '')
    .trim();
  if (!raw) return '<p>Product information will be updated shortly.</p>';

  const hits = [];
  for (const [heading, re] of LABELS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(raw))) hits.push({ start: m.index, end: re.lastIndex, heading });
  }
  hits.sort((a, b) => a.start - b.start);

  // Without authored headings keep intact paragraphs instead of guessing topics from ordinary words.
  if (!hits.length) {
    const paragraphs = raw.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const body = paragraphs.length ? paragraphs : [raw];
    return body.map((p, i) => '<section class="product-description-section"><h3>' + (i === 0 ? 'Product overview' : 'Product details') + '</h3><p>' + esc(p) + '</p></section>').join('');
  }

  // Text before the first label is the overview; the text after each label belongs to THAT label's heading.
  const sections = []; let cursor = 0; let current = 'Product overview';
  for (const h of hits) {
    if (h.start < cursor) continue;
    const body = raw.slice(cursor, h.start).trim();
    if (body) sections.push({ heading: current, body });
    current = h.heading; cursor = h.end;
  }
  const tail = raw.slice(cursor).trim();
  if (tail) sections.push({ heading: current, body: tail });

  // The same label twice in one description becomes one section.
  const merged = [];
  for (const s of sections) {
    const prev = merged.find(x => x.heading === s.heading);
    if (prev) prev.body += ' ' + s.body; else merged.push({ ...s });
  }
  return merged.map(x =>
    '<section class="product-description-section"><h3>' + esc(x.heading) + '</h3>' + renderBody(x.body.trim(), x.heading) + '</section>'
  ).join('');
}
