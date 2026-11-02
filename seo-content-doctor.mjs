// Stermont Arcade - Content Doctor.
// A content-quality layer for SEO Doctor: it does not invent facts or promise rankings.
// It scores public service/blog pages for useful, locally relevant, conversion-ready content
// and prints a practical "masterpiece brief" showing exactly what to strengthen.
// Node 18+, no installs.
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const esc = s => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const files = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true }).flatMap(x => {
  const p = `${d}/${x.name}`;
  return x.isDirectory() ? files(p) : (x.isFile() && x.name.endsWith('.html') ? [p] : []);
});
const pages = [
  ...files('services').filter(f => f !== 'services/index.html' && !/\/index\.html$/.test(f)),
  ...files('blog').filter(f => f !== 'blog/index.html')
].filter(existsSync)
  // Moved-page stubs (meta refresh to another URL) are redirects, not content: do not score them.
  .filter(f => !/<meta[^>]+http-equiv=["']refresh["']/i.test(readFileSync(f, 'utf8')));

function analyse(file) {
  const html = readFileSync(file, 'utf8');
  const text = esc(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim());
  const words = text ? text.split(/\s+/).length : 0;
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => esc(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
  const lower = text.toLowerCase();
  const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
  const internal = links.filter(u => u.startsWith('/') || u.startsWith(SITE)).length;
  const isService = file.startsWith('services/');
  const checks = [];
  const add = (label, ok, advice) => checks.push({ label, ok, advice });

  if (isService) {
    add('Clear service promise and audience', /(homes?|offices?|business|restaurant|hotel|airbnb|school|farm|shop|property|premises)/i.test(text) && words >= 350,
      'Say who the service is for and the problem it solves in the first 1–2 paragraphs.');
    add('Specific problems/services covered', /(bed bug|cockroach|rodent|termite|pest|cleaning|repair|installation|inspection|treatment|maintenance)/i.test(lower),
      'Name the real problems, service types or use cases customers search for; do not pad with synonyms.');
    add('Process customers can understand', /(inspect|inspection|assess|assessment|prepare|preparation|treat|treatment|follow.?up|aftercare|book|booking|step)/i.test(lower),
      'Explain the journey: what happens before, during and after the job.');
    add('Price or pricing explanation', /(ksh|price|pricing|cost|quote|quotation|rate|budget|inspection first|depends on)/i.test(lower),
      'Give a truthful starting/range price or explain what determines the quote.');
    add('Local relevance', /(nairobi|kenya|mombasa|nakuru|eldoret|kiambu|thika|naivasha|machakos|limuru|ruiru|area|county)/i.test(lower),
      'Use genuine service locations and Kenyan context naturally; never add a town just for SEO.');
    add('Safety/trust information', /(safe|safety|licensed|trained|guarantee|warranty|inspection|approved|experience|protect|children|pets)/i.test(lower),
      'Add verifiable safety, qualifications, guarantee, preparation or trust details where applicable.');
    add('Useful FAQ content', /<details\b/i.test(html) || /(frequently asked|common questions|\bfaq\b)/i.test(lower),
      'Answer the questions a customer would ask before booking, especially safety, preparation, timing and price.');
    add('Strong booking next step', /(whatsapp|book now|request|call|contact|schedule|quote|enquir|message)/i.test(lower),
      'End major sections with a clear, low-friction next step that matches the service.');
    add('Helpful internal connections', internal >= 3,
      'Link naturally to a related service, relevant guide/blog, pricing/shipping/contact page or useful product category.');
    add('Depth without filler', words >= 650 && headings.length >= 4,
      `Aim for roughly 650+ useful words and 4+ descriptive H2 sections; depth must add customer answers, not repetition.`);
  } else {
    add('Search intent answered early', words >= 500 && /<h1\b/i.test(html),
      'Answer the main question in the opening, then support it with practical detail.');
    add('Strong topical structure', headings.length >= 3,
      'Use descriptive H2s that map to real questions and subtopics.');
    add('Original practical detail', words >= 700 && /(how|why|when|before|after|choose|avoid|check|step)/i.test(lower),
      'Add concrete steps, examples, checks, trade-offs or decision guidance rather than generic filler.');
    add('Kenyan/local context where relevant', /(kenya|nairobi|ksh|local|county|airbnb|matatu|apartment|estate)/i.test(lower),
      'Add genuine local context only when it helps the reader.');
    add('Useful internal connections', internal >= 3,
      'Link to closely related products, categories, services and guides using natural anchor text.');
    add('Trust and next step', /(source|according|expert|qualified|experience|safety|contact|book|shop|quote|check)/i.test(lower),
      'Show why the advice is trustworthy and give the reader a sensible next action.');
    add('FAQ / objections covered', /<details\b/i.test(html) || /(frequently asked|common questions|\bfaq\b|is it safe|how long|how much)/i.test(lower),
      'Answer likely objections and questions so the page is useful without another search.');
    add('Readable depth', words >= 700,
      'Prefer complete, useful coverage over a thin article; remove repeated sentences before adding more words.');
  }

  const pass = checks.filter(c => c.ok).length;
  const score = Math.round(pass / checks.length * 100);
  const priority = checks.filter(c => !c.ok).map(c => c.advice);
  return { file, type: isService ? 'service' : 'blog', words, headings: headings.length, score, checks, priority };
}

const reports = pages.map(analyse);
const avg = reports.length ? Math.round(reports.reduce((n, r) => n + r.score, 0) / reports.length) : 0;
const weak = reports.filter(r => r.score < 70).sort((a, b) => a.score - b.score);
let out = `# SEO Doctor — Content Quality\n\nChecked **${reports.length}** public service/blog pages. Average content score: **${avg}/100**.\n\nThe Content Doctor follows a **masterpiece standard**: answer the customer's real question, prove useful details, show local relevance, explain the process and price honestly, remove uncertainty with FAQs, connect related pages, and finish with a clear next step. It never invents claims, locations, prices, guarantees or credentials.\n`;

for (const r of reports) {
  out += `\n## ${r.file} — ${r.score}/100\n`;
  out += `- Type: ${r.type}\n- Approx. words: ${r.words}\n- H2 sections: ${r.headings}\n`;
  for (const c of r.checks) out += `- ${c.ok ? '✅' : '⚠️'} ${c.label}${c.ok ? '' : ` — ${c.advice}`}\n`;
  if (r.priority.length) {
    out += `\n**Masterpiece brief:**\n`;
    r.priority.slice(0, 5).forEach((x, i) => { out += `${i + 1}. ${x}\n`; });
  }
}

out += `\n## Recommended content pattern\n\nFor a service page such as pest control/fumigation, the strongest structure is usually:\n1. **What we solve + who it is for** — plain-language promise and genuine locations.\n2. **Problems covered** — specific pests/issues and the situations customers recognise.\n3. **How the service works** — inspection, preparation, treatment, follow-up/aftercare where applicable.\n4. **Pricing** — honest range or the factors that determine a quote.\n5. **Safety and preparation** — practical instructions supported by the actual service facts.\n6. **Why choose us** — only verifiable experience, guarantees, qualifications or process advantages.\n7. **FAQs** — answer the final objections before booking.\n8. **Book / request a quote** — one obvious next step.\n9. **Related pages** — useful internal links, not keyword stuffing.\n\nThis is the quality bar the SEO Doctor will report against; it does not automatically publish copy because the final wording must remain truthful to the actual service.\n`;

console.log(out);

if (process.argv.includes('--json')) console.log(JSON.stringify(reports, null, 2));
