// Stermont Arcade - turns a catalogue description into professional, semantic HTML sub-topics (<section><h3>...).
// 1. Explicit headings written in capitals with a colon ("KEY FEATURES:") are kept as the section headings.
// 2. Unlabelled copy is sorted into a fixed, logical order of sub-topics (overview, features, specifications, uses, how to use, safety, storage, buying).
// Headings are only recognised in capitals followed by a colon, so ordinary words such as "use" or "order" inside a sentence are never treated as headings.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H = words => new RegExp('(?<![A-Za-z])(?:' + words + ')\\s*:', 'g');
const AND = '\\s*(?:&|AND)\\s*';

export const HEADINGS = [
  ['Product overview', H('PRODUCT OVERVIEW|OVERVIEW|ABOUT THIS PRODUCT|INTRODUCTION')],
  ['Key features & benefits', H(`KEY FEATURES(?:${AND}BENEFITS)?|FEATURES(?:${AND}BENEFITS)?|BENEFITS`)],
  ['Specifications & details', H(`SPECIFICATIONS(?:${AND}KEY DETAILS)?|TECHNICAL DETAILS|PRODUCT DETAILS|KEY DETAILS`)],
  ['Uses & applications', H(`WHERE IT HELPS|USES?(?:${AND}APPLICATIONS?)?|APPLICATIONS?|IDEAL FOR`)],
  ['How to use', H('HOW TO USE(?: IT)?|DIRECTIONS FOR USE|USAGE INSTRUCTIONS|BEFORE YOU START')],
  ['Safety information', H('SAFETY(?: INFORMATION| PRECAUTIONS)?|IMPORTANT SAFETY NOTES|PRECAUTIONS')],
  ['Storage & handling', H(`STORAGE(?:${AND}HANDLING)?|HANDLING`)],
  ['Frequently asked questions', H('FREQUENTLY ASKED QUESTIONS|FAQS?|COMMON QUESTIONS')],
  ['Ordering, payment & delivery', H(`ORDER(?:ING)?(?:${AND}(?:DELIVERY|PAYMENT))?|AVAILABILITY(?:${AND}DELIVERY)?|DELIVERY(?:${AND}PAYMENT)?|PAYMENT(?:${AND}DELIVERY)?`)],
  ['Important buying notes', H('IMPORTANT NOTES|BUYING NOTES|PLEASE NOTE|IMPORTANT INFORMATION')]
];

// Topic buckets for unlabelled copy. Order = display order; a sentence goes to the FIRST bucket (by priority) it matches.
const TOPICS = [
  { heading: 'Product overview', key: 'overview', test: null },
  { heading: 'Key features & benefits', key: 'features', test: /\b(features?|benefits?|designed|design|performance|durable|durability|effective|reliable|powerful|easy|convenient|quality|protects?|control|fast[- ]acting|long[- ]lasting|advantages?)\b/i },
  { heading: 'Specifications & pack details', key: 'specs', test: /\b(\d+(?:\.\d+)?\s?(?:ml|l|litres?|liters?|kg|g|w|v|mm|cm|inch(?:es)?|gb|mb|pack|pieces?|ec|sc|sl|wg|wp)|size|model|capacity|material|voltage|active ingredient|concentration|formulation|dimensions?|weight)\b/i },
  { heading: 'Uses & applications', key: 'uses', test: /\b(suitable|ideal|applications?|crops?|pests?|farms?|home|office|vehicle|garden|livestock|surfaces?|used (?:for|on|in)|use (?:on|in|for))\b/i },
  { heading: 'How to use', key: 'how', test: /\b(dilute|mix|spray|apply|dose|dosage|rate|directions?|instructions?|interval|before use|after use|shake)\b/i },
  { heading: 'Safety information', key: 'safety', test: /\b(safety|safe|gloves?|mask|protective|keep (?:away|out)|children|pets?|toxic|hazard(?:ous)?|warning|caution|poison)\b/i },
  { heading: 'Storage & handling', key: 'storage', test: /\b(store|storage|keep (?:in|cool|dry)|shelf life|expiry|dispose|disposal|handling)\b/i },
  { heading: 'Ordering, payment & delivery', key: 'buy', test: /\b(order|buy|price|stock|available|availability|delivery|deliver|Kenya|M-Pesa|WhatsApp|warranty|returns?|refund)\b/i }
];
// Safety and storage are checked before generic feature/use wording so label warnings are not buried.
const PRIORITY = ['safety', 'storage', 'how', 'specs', 'buy', 'features', 'uses'];

const splitSentences = text => text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'(•●▪])/).map(x => x.trim()).filter(Boolean);

export function sectionsFromHeadings(raw) {
  const hits = [];
  for (const [heading, re] of HEADINGS) { re.lastIndex = 0; let m; while ((m = re.exec(raw))) hits.push({ at: m.index, end: re.lastIndex, heading }); }
  hits.sort((a, b) => a.at - b.at);
  const kept = []; let last = -1;
  for (const h of hits) if (h.at >= last) { kept.push(h); last = h.end; }
  if (!kept.length) return null;
  const out = [];
  const intro = raw.slice(0, kept[0].at).trim();
  if (intro) out.push({ heading: 'Product overview', body: intro });
  kept.forEach((h, i) => {
    const body = raw.slice(h.end, i + 1 < kept.length ? kept[i + 1].at : raw.length).trim();
    if (body) out.push({ heading: h.heading, body });
  });
  return out;
}

export function sectionsFromTopics(raw) {
  const chunks = raw.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const parts = chunks.length > 1 ? chunks : splitSentences(raw);
  const buckets = Object.fromEntries(TOPICS.map(t => [t.key, []]));
  parts.forEach((part, i) => {
    if (i === 0) { buckets.overview.push(part); return; }          // the opening statement always introduces the product
    const key = PRIORITY.find(k => TOPICS.find(t => t.key === k).test.test(part)) || 'overview';
    buckets[key].push(part);
  });
  let out = TOPICS.filter(t => buckets[t.key].length).map(t => ({ heading: t.heading, body: buckets[t.key].join(chunks.length > 1 ? '\n' : ' ') }));
  // Keep a very long overview readable: break it into two labelled parts instead of one wall of text.
  if (out.length === 1 && out[0].body.length > 600) {
    const sents = splitSentences(out[0].body), half = Math.ceil(sents.length / 2);
    if (sents.length > 3) out = [{ heading: 'Product overview', body: sents.slice(0, half).join(' ') }, { heading: 'More product details', body: sents.slice(half).join(' ') }];
  }
  return out;
}

const renderBody = body => {
  const bullets = body.split(/\s*[•●▪]\s*/).map(x => x.trim()).filter(Boolean);
  if (bullets.length > 1) {
    const lead = /^[•●▪]/.test(body) ? '' : bullets.shift();
    return (lead ? '<p>' + esc(lead) + '</p>' : '') + '<ul>' + bullets.map(x => '<li>' + esc(x.replace(/^[-–]\s*/, '')) + '</li>').join('') + '</ul>';
  }
  const lines = body.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const items = lines.filter(l => /^[-–•●▪]\s*/.test(l));
  if (items.length === lines.length && items.length > 1) return '<ul>' + items.map(l => '<li>' + esc(l.replace(/^[-–•●▪]\s*/, '')) + '</li>').join('') + '</ul>';
  return lines.map(l => /^[-–•●▪]\s*/.test(l) ? '<ul><li>' + esc(l.replace(/^[-–•●▪]\s*/, '')) + '</li></ul>' : '<p>' + esc(l) + '</p>').join('');
};

export function productDescriptionHtml(source) {
  const raw = String(source || '').replace(/\bundefined\b/gi, '').replace(/Search phrases relevant to this advert include[\s\S]*$/i, '').trim();
  if (!raw) return '<p>Product information will be updated shortly.</p>';
  const sections = sectionsFromHeadings(raw) || sectionsFromTopics(raw);
  return sections.filter(s => s.body.trim()).map(s =>
    '<section class="product-description-section"><h3>' + esc(s.heading) + '</h3>' + renderBody(s.body.trim()) + '</section>').join('');
}
