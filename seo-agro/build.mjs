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

export function render(p) {
  const meta = metaDescription(p);
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
