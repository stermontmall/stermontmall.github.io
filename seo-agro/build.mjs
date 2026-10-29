// Builds paste-ready HTML + meta description for agrochemical batches.
// Usage: node seo-agro/build.mjs batch-01   (writes seo-agro/out/<batch>.html and <batch>.report.json)
// Only facts in the batch JSON are used. Anything not known stays "see label" and is listed in labelNeeded.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function metaDescription(p) {
  const price = p.fromPrice.toLocaleString('en-US');
  const at = p.sizes.includes(' and ') || p.sizes.includes(',') ? `from KSh ${price}` : `at KSh ${price}`;
  const ai = p.aiShort ? ` Active: ${p.aiShort}.` : '';
  const tails = [' Fast 47-county delivery & M-Pesa. Order at Stermont Arcade!', ' 47-county delivery & M-Pesa. Order at Stermont Arcade!', ' 47-county delivery, M-Pesa. Order now!'];
  const name = p.name;
  const heads = [
    `Buy ${name} in Kenya ${at}. Effective for ${p.uses}.${ai}`,
    `Buy ${name} in Kenya ${at}. For ${p.uses}.${ai}`,
    `Buy ${name} ${at}. For ${p.uses}.${ai}`,
    `Buy ${name} in Kenya ${at}. Effective for ${p.uses}.`,
    `Buy ${name} in Kenya ${at}. For ${p.uses}.`,
  ];
  let best = null;
  for (const h of heads) for (const t of tails) {
    const s = h + t;
    if (s.length >= 150 && s.length <= 160) return s;
    if (s.length <= 160 && (!best || s.length > best.length)) best = s;
  }
  return best;
}

// Extra sections that bring every description into the 300-600 word range. Facts come only from the batch JSON.
export function extras(p) {
  const sizeQ = p.sizes.includes(' and ') || p.sizes.includes(',');
  const one = p.sizes.replace(/Litres$/, 'Litre');
  const faq = [
    [`What is ${p.name} used for?`, `${p.targets}. It is meant for: ${p.settings}.`],
    [`How do I mix and apply ${p.name}?`, `Follow the dose and water volume on the manufacturer's label. ${p.method}`],
    [`Is ${p.name} safe to handle?`, `Treat it as a pesticide: wear full protective clothing, keep children, pets and livestock away, and keep spray out of water sources.`],
    [sizeQ ? `Which pack size should I choose?` : `What pack size is available?`, sizeQ ? `${p.name} comes in ${p.sizes}. Small packs suit trials, kitchen gardens and small plots; larger packs suit bigger acreages, so you do not run short in the middle of a job.` : /\d/.test(one) ? `${p.name} is sold in a ${one} pack.` : `${p.name} is sold as a ${one}.`],
    [`How do I buy ${p.name} in Kenya?`, `Pay by M-Pesa and we deliver to all 47 counties, or collect at The Sarit Centre, Westlands, Nairobi. Questions? WhatsApp +254 748 888 230.`],
  ];
  const why = `Stermont Arcade is an online agrovet and pest control store at The Sarit Centre, Westlands, Nairobi. Buy ${p.name} with an upfront price in Kenya shillings, M-Pesa payment, delivery to all 47 counties and WhatsApp support. Always read the label before use.`;
  return { faq, why };
}

export function render(p) {
  const meta = metaDescription(p);
  const ex = extras(p);
  const ai = p.ai || 'See the product label (not stated in our catalog)';
  const form = p.formulation || 'See the product label';
  const steps = [
    `<li><strong>Dilution Rate:</strong> Use the dose and water volume printed on the manufacturer's label for your crop and growth stage.</li>`,
    `<li><strong>Application Method:</strong> ${esc(p.method)}</li>`,
    `<li><strong>Coverage Area:</strong> Depends on the dose and spray volume on the label. Available in ${esc(p.sizes)}; choose the pack that matches your acreage.</li>`,
    ...p.extraSteps.map(s => `<li>${esc(s)}</li>`),
  ];
  const html = `<!-- ${esc(p.name)} | /p/${p.slug}.html -->
<meta name="description" content="${esc(meta)}">
<div class="product-description-container">
    <p class="product-lead">${esc(p.lead)}</p>

    <h3>Key Specifications &amp; Features:</h3>
    <ul>
        <li><strong>Active Ingredient:</strong> ${esc(ai)}</li>
        <li><strong>Target:</strong> ${esc(p.targets)}</li>
        <li><strong>Formulation:</strong> ${esc(form)}</li>
        <li><strong>Application Settings:</strong> ${esc(p.settings)}</li>
    </ul>

    <h3>Mixing &amp; Application Instructions:</h3>
    <ol>
        ${steps.join('\n        ')}
    </ol>

    <h3>Safety &amp; Re-Entry Precautions:</h3>
    <ul>
        <li><strong>Required PPE:</strong> Gloves, mask, goggles, overalls and boots when mixing and spraying.</li>
        <li><strong>Re-Entry:</strong> Keep people, children and animals out of the sprayed area until the spray has dried, and follow the re-entry and pre-harvest intervals on the label.</li>
        <li><strong>Water &amp; Storage:</strong> Keep spray and rinse water away from streams, ponds and wells. Store in the original closed container, cool, dry and locked, away from food and feed.</li>
    </ul>

    <h3>Why Buy ${esc(p.name)} from Stermont Arcade:</h3>
    <p>${esc(ex.why)}</p>

    <h3>Frequently Asked Questions:</h3>
    ${ex.faq.map(([q, a]) => `<p><strong>${esc(q)}</strong><br>${esc(a)}</p>`).join('\n    ')}
</div>
`;
  return { meta, html };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const batch = process.argv[2] || 'batch-01';
  const items = JSON.parse(fs.readFileSync(path.join(dir, batch + '.json'), 'utf8'));
  fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
  const report = [];
  let all = '';
  for (const p of items) {
    const r = render(p);
    all += r.html + '\n';
    report.push({ group: p.group, slug: p.slug, metaLength: r.meta.length, meta: r.meta, labelNeeded: p.labelNeeded });
  }
  fs.writeFileSync(path.join(dir, 'out', batch + '.html'), all);
  fs.writeFileSync(path.join(dir, 'out', batch + '.report.json'), JSON.stringify(report, null, 1));
  for (const r of report) console.log(r.metaLength, r.group);
}

// Plain-text description in the format the generator already renders (CAPITAL headings, bullets). This is what is stored in products.description.
export function renderText(p) {
  const ai = p.ai || 'See the product label';
  const form = p.formulation || 'See the product label';
  const L = [];
  L.push(`${p.name} (${p.sizes.replace(/ and /g, ', ')})`, '', p.lead, '', 'KEY SPECIFICATIONS & FEATURES');
  L.push(`• Active ingredient: ${ai}`, `• Target: ${p.targets}`, `• Formulation: ${form}`, `• Application settings: ${p.settings}`, '');
  L.push('MIXING & APPLICATION INSTRUCTIONS');
  L.push(`1. Dilution rate: use the dose and water volume printed on the manufacturer's label for your crop and growth stage.`);
  L.push(`2. Application method: ${p.method}`);
  L.push(`3. Coverage: depends on the dose and spray volume on the label. Available in ${p.sizes}.`);
  p.extraSteps.forEach((s, i) => L.push(`${4 + i}. ${s}`));
  L.push('', 'SAFETY & RE-ENTRY PRECAUTIONS');
  L.push('• Wear gloves, a mask, goggles, overalls and boots when mixing and spraying.');
  L.push('• Keep people, children and animals out of the sprayed area until the spray has dried, and follow the re-entry and pre-harvest intervals on the label.');
  L.push('• Keep spray and rinse water away from streams, ponds and wells. Store in the original closed container, cool, dry and locked, away from food and feed.', '');
  L.push(...textTail(p));
  return L.join('\n');
}

// Everything from "WHY BUY" to the end.
export function textTail(p) {
  const ex = extras(p);
  return [`WHY BUY ${p.name.toUpperCase()} FROM STERMONT ARCADE`, ex.why, '', 'FREQUENTLY ASKED QUESTIONS', ...ex.faq.flatMap(([q, a]) => [q, a, '']), `ORDER\nOrder ${p.name} online, pay by M-Pesa and get delivery to all 47 counties, or pick up at The Sarit Centre, Westlands, Nairobi. WhatsApp orders: +254 748 888 230.`];
}
