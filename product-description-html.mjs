// Stermont Arcade - renders a catalogue description as semantic sections (used by generate-products.mjs).
// Layout goal (owner request 2026-11-09, modelled on the section order of a well-organised product page):
//   Product overview -> Key features -> Specifications -> Uses -> How to use -> Before you start -> Safety -> Storage -> FAQs -> Ordering.
// Fix 2026-11-09: the text that follows an uppercase label (KEY FEATURES, HOW TO USE ...) now keeps that label's heading.
// Before, only the last label kept it and every other section was rendered as a generic "Product information" heading.
// Descriptions without labels render exactly as before (overview + details paragraphs); no heading is ever guessed from ordinary words.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = s => esc(s)
  .replace(/\\[([^\\]]+)\\]\\((?:https?:\\/\\/stermontarcade\\.co\\.ke)?(\\/[^)\\s]*)\\)/g, '<a href="$2">$1</a>')
  .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');

// Only explicit uppercase section labels match. Never ordinary words such as "used", "order" or "safety" inside sentences.
const LABELS = [
  ['Product overview', /(?:^|\s)(?:PRODUCT SUMMARY|PRODUCT OVERVIEW)\s*:?\s*/g],
  ['Key features & benefits', /(?:^|\s)KEY PRODUCT FEATURES\s*:?\s*|(?:^|\s)KEY FEATURES(?:\s*&\s*BENEFITS)?\s*:?\s*/g],
  ['Specifications & product details', /(?:^|\s)SPECIFICATIONS\s*:?\s*/g],
  ['Uses & applications', /(?:^|\s)WHERE IT HELPS\s*:?\s*|(?:^|\s)APPLICATION(?:S)?\s*&?\s*USE\s*:?\s*/g],
  ['Application & dosage guidelines', /(?:^|\s)APPLICATION\s*&\s*DOSAGE GUIDELINES\s*:?\s*/g],
  ['How to use', /(?:^|\s)HOW TO USE(?: IT)?\s*:?\s*|(?:^|\s)DIRECTIONS FOR USE\s*:?\s*/g],
  ['Before you start', /(?:^|\s)BEFORE YOU START\s*:?\s*/g],
  ['Safety information', /(?:^|\s)SAFETY(?:\s+AND\s+RESPONSIBLE\s+(?:HANDLING|USE)|\s+INFORMATION|\s+PRECAUTIONS|\s+PROTOCOLS(?:\s*&\s*PRECAUTIONS)?)?\s*:?\s*/g],
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
  if (heading.toLowerCase().includes('frequently asked questions') || heading.toLowerCase() === 'faqs') {
    const qLines = body.split(/\n+/).map(x => x.trim()).filter(Boolean);
    const marked = qLines.filter(x => /^Q:\s*/i.test(x));
    if (marked.length) return marked.map(q => {
      const rest = q.replace(/^Q:\s*/i, '');
      const split = rest.match(/^(.+?\?)\s+([\s\S]+)$/);
      const question = split ? split[1] : rest;
      const answer = split ? split[2] : (qLines.slice(qLines.indexOf(q) + 1).find(x => !/^Q:/i.test(x)) || '');
      return '<p><strong>' + inline(question) + '</strong></p>' + (answer ? '<p>' + inline(answer) + '</p>' : '');
    }).join('');
    const faq = splitFaq(body);
    if (faq) return faq.map(i => '<p><strong>' + inline(i.q) + '</strong><br>' + inline(i.a) + '</p>').join('');
  }
  const startsWithBullet = /^\s*[•●▪]/.test(body);
  const pieces = body.split(/\s*[•●▪]\s*/).map(x => x.trim()).filter(Boolean);
  if (pieces.length > 1 || (startsWithBullet && pieces.length)) {
    const lead = startsWithBullet ? '' : pieces.shift();
    return (lead ? '<p>' + inline(lead) + '</p>' : '') + '<ul>' + pieces.map(x => '<li>' + inline(x.replace(/^[-–]\s*/, '')) + '</li>').join('') + '</ul>';
  }
  const blocks = body.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
  return blocks.flatMap(block => block.split(/\n+/).map(x => x.trim()).filter(Boolean).flatMap(line => {
    if (/^[-–•●▪]\s*/.test(line)) return ['<ul><li>' + inline(line.replace(/^[-–•●▪]\s*/, '')) + '</li></ul>'];
    const sentences = line.match(/[^.!?]+(?:[.!?]+|$)/g) || [line];
    const paras = [];
    for (let i = 0; i < sentences.length; i += 3) paras.push('<p>' + inline(sentences.slice(i, i + 3).join(' ').trim()) + '</p>');
    return paras;
  })).join('');
}


// Extract exactly four authored buyer Q&As for product FAQPage JSON-LD.
export function extractProductFaq(source) {
  let raw = String(source || '').replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/^#[^#\n]*##[ \t]*/i, '## ')
    .replace(/[ \t]+##[ \t]+/g, '\n\n## ')
    .replace(/[ \t]+###[ \t]+/g, '\nQ: ');
  const start = raw.search(/(?:##\s*)?(?:FREQUENTLY ASKED QUESTIONS|FAQS?)\b/i);
  if (start < 0) return [];
  let body = raw.slice(start).replace(/^(?:##\s*)?(?:FREQUENTLY ASKED QUESTIONS|FAQS?)\b:?/i, '');
  const nextSection = body.search(/\n##\s+/);
  if (nextSection >= 0) body = body.slice(0, nextSection);
  const matches = [...body.matchAll(/Q:\s*(.+?\?)\s*([\s\S]*?)(?=\nQ:\s*|$)/gi)];
  const pairs = matches.map(m => ({ q: m[1].trim(), a: m[2].trim() })).filter(x => x.q && x.a);
  return pairs.length === 4 ? pairs : [];
}

function normalizeMarkdownHeading(value) {
  const h = value.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, ' ').trim();
  if (/(product overview|overview|key features|key benefits|product summary)/.test(h)) return 'Product Overview & Key Benefits';
  if (/(technical|specification|identity|formulation|pack details|exact pack|product details|product information)/.test(h)) return 'Technical Specifications & Pack Details';
  if (/(where|target pests|registered|application|uses|use in kenya|pest-control context|intended buyer|supplier-described public-health)/.test(h)) return 'Where & How to Use in Kenya';
  if (/(safety|storage|handling|before purchasing|label|regulatory|precaution|ppe)/.test(h)) return 'Safety, Storage & Handling Guidelines';
  if (/(buying|pack.size|price|comparison|compare|choosing|purchase|source price|value)/.test(h)) return 'Buying & Pack-Size Guide';
  if (/(ordering|delivery|pickup|order)/.test(h)) return 'Delivery across Kenya & Nairobi Pickup';
  if (/(frequently asked questions|^faqs?$)/.test(h)) return 'Frequently Asked Questions';
  return value;
}

function splitInlineMarkdownHeadings(source) {
  let text = source;
  // Product overview headings were followed immediately by the product name and opening sentence.
  text = text.replace(/##\s+Product overview\s+(.{1,120}?\s+is\s+)/gi,
    (_m, opening) => '\n## Product Overview & Key Benefits\n\n' + opening);
  // Earlier catalogue drafts placed each section title and its first sentence on the same line.
  // Split only at known sentence-opening cues; retain every original word and map the title to a canonical section.
  const cues = '(?:The|This|PCPB|Agropests|Imagine Care|Cheapthings|Farm Rescue|Naivas|Jumia|Osho|PPCK|Customers|Shoppers|People|Before|Check|Confirm|Use|Do|Keep|If|Once|For|One|A larger|A smaller|A small|A product|A 20|A 100|The current)';
  const re = new RegExp('##\\s+([^\\n]{3,110}?)\\s+(' + cues + ')\\b', 'g');
  text = text.replace(re, (_m, title, start) => {
    const canonical = normalizeMarkdownHeading(title);
    return '\n## ' + canonical + '\n' + start;
  });
  return text;
}

export function productDescriptionHtml(source) {
  // Remove generic buying-guide boilerplate; retain the product-specific copy.
  const raw = String(source || '')
    // Decode stored escaped line breaks; split inline Markdown headings into renderer section boundaries.
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/^#[^#\n]*##[ \t]*/i, '## ')
    .replace(/[ \t]+##[ \t]+/g, '\n\n## ')
    .replace(/[ \t]+###[ \t]+([^#\n]+)/g, '\nQ: $1\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\bundefined\b/gi, '')
    .replace(/\s*Search phrases relevant to this advert include[\s\S]*$/i, '')
    .replace(/\s*PRODUCT BUYING GUIDE:[\s\S]*$/i, '')
    .trim();
  raw = splitInlineMarkdownHeadings(raw);
  if (!raw) return '<p>Product information will be updated shortly.</p>';

  const hits = [];
  // Markdown H2 headings are section boundaries too. H3 FAQ questions are retained as Q: lines.
  const markdownHeading = /^##\s+(.+?)\s*$/gm;
  let mh;
  while ((mh = markdownHeading.exec(raw))) hits.push({ start: mh.index, end: markdownHeading.lastIndex, heading: normalizeMarkdownHeading(mh[1].trim()) });
  for (const [heading, re] of LABELS) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(raw))) hits.push({ start: m.index, end: re.lastIndex, heading });
  }
  hits.sort((a, b) => a.start - b.start);

  // Owner request: every catalogue description should have useful, search-friendly section subtitles.
  // For unlabelled copy, split at sentence boundaries and apply conservative topic cues. No facts are added or removed.
  if (!hits.length) {
    const paragraphs = raw.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const source = paragraphs.length ? paragraphs.join(' ') : raw;
    const parts = source.match(/[^.!?]+(?:[.!?]+|$)/g) || [source];
    const sentences = [];
    for (const part of parts.map(x => x.trim()).filter(Boolean)) {
      const prev = sentences[sentences.length - 1] || '';
      if (/\b(?:e\.g|i\.e|etc|approx|Dr|Mr|Mrs|Ms|St|No|vs)\.$/i.test(prev)) sentences[sentences.length - 1] += ' ' + part;
      else sentences.push(part);
    }
    const groups = sentences.length ? [sentences.slice(0, 2).join(' ')] : [];
    for (let i = 2; i < sentences.length; i += 2) groups.push(sentences.slice(i, i + 2).join(' '));
    if (!groups.length) groups.push(source);
    const rules = [
      ['Safety information', /\b(safety|safe handling|avoid|never|warning|risk|injur|children|pets|protective|PPE|veterinar|withdrawal|poison|hazard|distress)\b/i],
      ['Care, cleaning & storage', /\b(clean|wash|rinse|store|storage|maintenance|inspect|replace|dry|care|after use|shelf life|keep .{0,15} dry)\b/i],
      ['How to use & application', /\b(how to|before use|apply|application|install|prepare|fill|mix|follow|directions|instructions|operate|procedure|feeding|feed rate|dose|dosage|use the|using the)\b/i],
      ['Uses & applications', /\b(used for|suitable for|ideal for|intended for|designed for|useful for|application|farmers|household|commercial|smallholder|livestock|crop|garden|home use)\b/i],
      ['Features & specifications', /\b(features?|design|material|made from|capacity|size|dimensions|specification|model|pack size|weight|power|voltage|length|width|diameter|formulation|contains|includes|construction)\b/i],
      ['Buying guide & product checks', /\b(before ordering|before purchase|confirm|ask the seller|ask supplier|check with|compare|listing|purchase|buying|exact model|variant|compatib|supplied|availability)\b/i]
    ];
    const sections = groups.map((body, i) => {
      if (i === 0) return { heading: 'Product overview', body };
      const ranked = rules.map(([heading, re], order) => ({ heading, score: (body.match(new RegExp(re.source, 'gi')) || []).length, order }))
        .sort((a, b) => b.score - a.score || a.order - b.order);
      return { heading: ranked[0].score ? ranked[0].heading : 'Product details', body };
    });
    const merged = [];
    for (const section of sections) {
      const prev = merged.find(x => x.heading === section.heading);
      if (prev) prev.body += ' ' + section.body;
      else merged.push({ ...section });
    }
    return merged.map(x => '<section class="product-description-section"><h3>' + esc(x.heading) + '</h3>' + renderBody(x.body, x.heading) + '</section>').join('');
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
  const sectionOrder = ['Product Overview & Key Benefits', 'Technical Specifications & Pack Details', 'Where & How to Use in Kenya', 'Safety, Storage & Handling Guidelines', 'Buying & Pack-Size Guide', 'Delivery across Kenya & Nairobi Pickup', 'Frequently Asked Questions'];
  merged.sort((a, b) => {
    const ai = sectionOrder.indexOf(a.heading), bi = sectionOrder.indexOf(b.heading);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return merged.map(x =>
    '<section class="product-description-section"><h3>' + esc(x.heading) + '</h3>' + renderBody(x.body.trim(), x.heading) + '</section>'
  ).join('');
}
