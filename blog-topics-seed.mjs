// Stermont Arcade - tops up blog-topics.json with one "pending" buyer-guide topic per real, in-stock product page.
// Run it before blog-write.mjs whenever fewer than SEED_LOW topics are pending: node blog-topics-seed.mjs
// Safe by design: facts come ONLY from each product page's own Specifications block (no prices, no dosing, no marketing claims),
// categories are interleaved so every part of the catalogue gets coverage, and every draft still arrives as a pull request for review.
// Node 18+, no installs.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const FILE = 'blog-topics.json';
const MAX = Number(process.env.SEED_MAX || 14);   // new topics per run
const LOW = Number(process.env.SEED_LOW || 10);   // top up only when fewer than this many are pending
const dec = s => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");

const data = JSON.parse(readFileSync(FILE, 'utf8'));
data.topics ||= [];
const pending = data.topics.filter(t => t.status === 'pending').length;
if (pending >= LOW && !process.env.FORCE) { console.log(`${pending} topics still pending - no top-up needed.`); process.exit(0); }
if (!existsSync('p')) { console.log('No p/ folder - nothing to seed from.'); process.exit(0); }

const covered = new Set(data.topics.flatMap(t => t.links || []));
const slugs = new Set(data.topics.map(t => t.slug));
const KEYS = /^(brand|product|model|active ingredients?|pack size|size|capacity|colou?r|material|type|volume|weight|power)$/i;
const CHEM = /insect|pest|rodent|\brats?\b|termite|fumig|disinfect|pesticid|herbicid|fungicid|acaricid|weed|spray|bait/i;
const VET = /veterin|vaccine|drug|dewormer|antibiotic|\bvet\b/i;
const FEED = /feed|premix|mineral|supplement|lysine|phosphate/i;

const cands = [];
for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  const path = `/p/${f}`;
  if (covered.has(path)) continue;
  const slug = `${f.replace(/\.html$/, '')}-buyers-guide`.slice(0, 100);
  if (slugs.has(slug) || existsSync(`blog/${slug}.html`)) continue;
  const html = readFileSync(`p/${f}`, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue;                                              // size-redirect pages
  if ((html.match(/product:availability" content="([^"]*)"/i) || [])[1] !== 'in stock') continue;   // real stock only
  let prod = null;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); if (j['@type'] === 'Product') { prod = j; break; } } catch {}
  }
  if (!prod || !prod.name) continue;
  const desc = (html.match(/<div class="desc">([\s\S]*?)<\/div>/) || [])[1] || '';
  const spec = (desc.match(/\nSpecifications\n([\s\S]*?)(?:\n(?:Safety|Order)\b|$)/) || [])[1] || '';
  const facts = [];
  for (const line of dec(spec).split('\n')) {
    const m = line.match(/^([A-Za-z ]{2,24}):\s*(.{1,120})$/);
    if (m && KEYS.test(m[1].trim()) && !/pcpb|regist/i.test(line)) facts.push(`${m[1].trim()}: ${m[2].trim()}`);
  }
  if (facts.length < 2) continue;   // too thin to write something genuinely useful - skip rather than pad
  const name = dec(prod.name), cat = dec(prod.category || '').trim();
  const short = name.replace(/\s[–-]\s.*$/, '').replace(/…$/, '').trim();
  const catPath = (html.match(/<nav class="bc">[\s\S]*?href="(\/c\/[^"]+)"/) || [])[1];
  const kind = `${cat} ${name}`;
  const angle = VET.test(kind)
    ? `Buyer guide to the ${name}: who it is for, what the listed specifications mean, why to ask a vet or animal health officer first, what to check on the pack (expiry, storage, registration) and keeping records. No dosing or schedules: follow your vet and the label.`
    : CHEM.test(kind)
      ? `Buyer guide to the ${name}: who it suits, what the listed specifications mean, what to check on the pack (registration, expiry, directions), safe storage and use around children, pets and food, and when to ask a qualified professional. No dilution rates, dosing or mixing instructions: always follow the label.`
      : FEED.test(kind)
        ? `Buyer guide to the ${name}: which animals or stage it is meant for as listed, how to read the label, storage and avoiding mould, and asking a nutritionist. No formulation or inclusion rates: follow the label.`
        : `Plain buying guide for the ${name}: who it suits, the listed specifications and what to compare, everyday care and safe use, and questions to ask before ordering.`;
  cands.push({
    cat: cat || 'other',
    topic: {
      slug,
      title: `${short}: what to know before you buy in Kenya`,
      angle,
      keywords: [`${short} Kenya`, `${short} price in Kenya`, `buy ${short} Nairobi`],
      facts: [
        `We list the ${name} on our online store${cat ? `, in the ${cat} category` : ''}.`,
        `Listed specifications: ${facts.join('; ')}.`,
        'Pay by M-Pesa. Delivery to all 47 counties. Faulty items can be returned within 48 hours of delivery.'
      ],
      links: [path, ...(catPath ? [catPath] : []), '/products.html'],
      status: 'pending',
      seeded: new Date().toISOString().slice(0, 10)
    }
  });
}

// Interleave categories so one category never floods the queue.
const groups = new Map();
for (const c of cands) (groups.get(c.cat) || groups.set(c.cat, []).get(c.cat)).push(c.topic);
const lists = [...groups.values()], picked = [];
while (picked.length < MAX && lists.some(l => l.length)) for (const l of lists) if (l.length && picked.length < MAX) picked.push(l.shift());

if (!picked.length) { console.log('No new eligible products to add topics for.'); process.exit(0); }
data.topics.push(...picked);
writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
console.log(`Added ${picked.length} topics across ${groups.size} categories (${cands.length - picked.length} eligible left for later).`);
