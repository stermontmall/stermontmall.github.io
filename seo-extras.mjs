// Stermont Arcade - seo-extras
// Builds two files from the pages already in this repo (no installs, Node 18+):
//   1) sitemap-images.xml  - lets Google Images index every product photo (each product page + its main photo)
//   2) llms.txt            - a plain-text guide for AI search (ChatGPT, Perplexity, Gemini, Claude) listing who you are,
//                            how ordering works, and your main categories, guides and top products
// Usage: node seo-extras.mjs
// Runs from .github/workflows/seo-extras.yml after pages change, and every Monday.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const list = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.html')).sort() : []);
const read = f => readFileSync(f, 'utf8');
const title = h => unesc(((h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim());
const desc = h => { const m = h.match(/<meta name=["']description["'] content=(?:"([^"]*)"|'([^']*)')/i); return m ? unesc(m[1] || m[2] || '').trim() : ''; };
const og = h => (h.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i) || [])[1] || '';

// ---------- 1) image sitemap ----------
let imgCount = 0, pageCount = 0;
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/image/1.1">\n`;
for (const f of list('p')) {
  const h = read(`p/${f}`);
  if (/http-equiv="refresh"/i.test(h)) continue;                       // size-variant redirect pages are not indexable
  const img = og(h);
  if (!img || /placeholder\.svg/.test(img) || /logo\.png$/.test(img)) continue; // no real product photo yet
  const name = title(h).split('|')[0].trim();
  xml += `<url><loc>${SITE}/p/${f}</loc><image:image><image:loc>${esc(img)}</image:loc><image:title>${esc(name)}</image:title></image:image></url>\n`;
  imgCount++; pageCount++;
}
xml += `</urlset>\n`;
writeFileSync('sitemap-images.xml', xml);

// ---------- 2) llms.txt ----------
const cats = list('c').filter(f => f !== 'index.html').map(f => ({ f, h: read(`c/${f}`) }))
  .filter(({ h }) => !/http-equiv="refresh"/i.test(h));
const posts = list('blog').filter(f => f !== 'index.html').map(f => ({ f, h: read(`blog/${f}`) }));
const products = list('p').map(f => ({ f, h: read(`p/${f}`) })).filter(({ h }) => !/http-equiv="refresh"/i.test(h));

let t = `# Stermont Arcade\n\n`;
t += `> Online store in Kenya selling pest control and fumigation products, agrovet supplies, phones, TVs, appliances and home goods. Customers pay by M-Pesa and we deliver to all 47 counties. Shop: ${SITE}/\n\n`;
t += `## Key facts\n`;
t += `- Location: The Sarit Centre, Karuna Road, Westlands, Nairobi, Kenya\n`;
t += `- Phone / WhatsApp: +254 748 888 230\n`;
t += `- Email: support@stermontarcade.co.ke\n`;
t += `- Payment: M-Pesa. Currency: Kenya shillings (KES)\n`;
t += `- Delivery: all 47 counties. Details: ${SITE}/shipping.html\n`;
t += `- Returns: ${SITE}/returns.html\n`;
t += `- Pest control and agrochemical products should carry a PCPB (Pest Control Products Board) registration number on the label\n\n`;
t += `## Main pages\n`;
for (const [u, n] of [['', 'Home'], ['/nairobi.html', 'Shop in Nairobi'], ['/bulk-quote.html', 'Request a bulk quote'], ['/products.html', 'All products'], ['/c/', 'All categories'], ['/blog/', 'Buying guides and how-tos'], ['/about.html', 'About us'], ['/faq.html', 'FAQ'], ['/contact.html', 'Contact'], ['/track.html', 'Track an order']])
  t += `- [${n}](${SITE}${u})\n`;
t += `\n## Categories\n`;
for (const { f, h } of cats) t += `- [${title(h).split('|')[0].trim()}](${SITE}/c/${f})${desc(h) ? `: ${desc(h)}` : ''}\n`;
t += `\n## Guides\n`;
for (const { f, h } of posts) t += `- [${title(h).split('|')[0].trim()}](${SITE}/blog/${f})${desc(h) ? `: ${desc(h)}` : ''}\n`;
t += `\n## Optional\n`;
t += `- [Product sitemap](${SITE}/sitemap-products.xml): all ${products.length} product pages\n`;
t += `- [Image sitemap](${SITE}/sitemap-images.xml)\n`;
t += `- [Merchant feed](${SITE}/merchant-feed.xml)\n`;
writeFileSync('llms.txt', t);

console.log(`sitemap-images.xml: ${imgCount} product photos across ${pageCount} pages`);
console.log(`llms.txt: ${cats.length} categories, ${posts.length} guides`);
