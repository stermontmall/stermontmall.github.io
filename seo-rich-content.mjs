// Stermont Arcade - rich-content pass for product pages (runs from seo-overrides.mjs, after seo-product-extras.mjs).
// Adds, using only facts the page already has or facts that are true for the whole store (shipping.html, nairobi.html):
// 1) "Price of <product> by size" table when a product has several pack sizes (replaces the plain "Available sizes" list).
// 2) "Buy <product> in Nairobi, Kiambu, Nakuru, Kisumu, Eldoret & Mombasa" box with the phone / WhatsApp number and a 3-step "how to order".
// 3) For PCPB-regulated categories only: a link out to the Pest Control Products Board website to check registration.
// 4) A visible "Frequently asked questions" box (price, delivery, M-Pesa, how to buy) so the FAQ schema on the page matches what visitors can read.
// It never invents dosages, ingredients or coverage: those come from each product's own description (Supabase) and the structured sections of seo-product-extras.mjs.
// Safe by design: every page is wrapped in try/catch, a page that already has the marker is skipped. To switch it off, delete the import line in seo-overrides.mjs.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const WA = '254748888230', PHONE = '+254 748 888 230';
const MARK = '<!--stm-rich-->';
const PCPB = new Set(['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals',
  'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators']);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const STYLE = '<style>.pt{padding:clamp(1rem,2.5vw,1.5rem)}.pt h2{margin:0 0 .9rem}.pack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:.8rem}.pack-card{display:flex;flex-direction:column;gap:.55rem;min-width:0;padding:1rem;border:1px solid #e5e7eb;border-radius:14px;background:linear-gradient(180deg,#fff 0%,#faf9ff 100%)}.pack-card .pack-size{font-size:1.05rem;font-weight:800;color:#172033}.pack-card .pack-price{font-size:1.45rem;line-height:1.2;font-weight:850;letter-spacing:-.025em;color:#4c1d95}.pack-card .pack-stock{font-size:.88rem;font-weight:750}.pack-card .pack-stock.ok{color:#15803d}.pack-card .pack-stock.no{color:#b91c1c}.pack-card .pack-order{display:block;margin-top:auto;padding:.7rem .85rem;border-radius:10px;background:#15803d;color:#fff;text-align:center;text-decoration:none;font-weight:800}.pack-card .pack-unavailable{margin-top:auto;padding:.7rem .85rem;border-radius:10px;background:#f1f5f9;color:#64748b;text-align:center;font-weight:700}.how ol{margin:.3rem 0 .6rem;padding-left:1.2rem}.how li{margin:.25rem 0}@media(max-width:480px){.pack-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}.pack-card{padding:.75rem}.pack-card .pack-price{font-size:1.2rem}.pack-card .pack-order,.pack-card .pack-unavailable{padding:.65rem .45rem;font-size:.9rem}}</style>';

let done = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK) || !/<h1>/.test(h)) continue;   // already done, or a redirect stub
    const before = h;
    // The H1 starts with the "Buy" prefix (seo-meta.mjs buyName). The headings and sentences below add their own "Buy", so drop it here (no "Buy Buy Original ...").
    const name = unesc(h.match(/<h1>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '').trim()).replace(/^Buy\s+/i, '');
    const nm = esc(name);

    // 1) price table by size
    h = h.replace(/<div class="box"><h2 style="margin-top:0">Available sizes<\/h2><ul class="g">([\s\S]*?)<\/ul><\/div>/, (m, inner) => {
      const rows = [...inner.matchAll(/<li>([\s\S]*?)<span>([\s\S]*?)<\/span><small class="(ok|no)">([\s\S]*?)<\/small>(?: <a href="([^"]*)">[\s\S]*?<\/a>)?<\/li>/g)];
      if (!rows.length) return m;
      return `<section class="box pt" aria-label="Available pack sizes and prices"><h2>Choose your pack size</h2><div class="pack-grid">` +
        rows.map(r => `<article class="pack-card"><div class="pack-size">${r[1]}</div><div class="pack-price">${r[2]}</div><div class="pack-stock ${r[3]}">${r[4]}</div>${r[5] ? `<a class="pack-order" href="${r[5]}" rel="noopener">Order this pack on WhatsApp</a>` : '<span class="pack-unavailable">Currently unavailable</span>'}</article>`).join('') + '</div></section>';
    });

    // 2) local delivery + how to order
    const ask = `https://wa.me/${WA}?text=${encodeURIComponent(`Hello Stermont Arcade, I want to order ${name}. My town is: `)}`;
    const local = `<div class="box how"><h2 style="margin-top:0">Buy ${nm} in Nairobi, Kiambu, Nakuru, Kisumu, Eldoret &amp; Mombasa</h2>` +
      `<p>Stermont Arcade delivers to Nairobi, Kiambu, Nakuru, Kisumu, Eldoret, Mombasa and every other county in Kenya. Nairobi orders usually arrive the same day or the next day, and other counties usually within 1 to 3 days.</p>` +
      `<h3 style="font-size:1.05rem;margin:.6rem 0 .2rem;color:#5b21b6">How to order</h3><ol><li>Add the product to your cart, or message us on WhatsApp.</li><li>Pay by M-Pesa and enter the M-Pesa code from your SMS.</li><li>We confirm the delivery fee for your town before you pay, then dispatch your order.</li></ol>` +
      `<p>Call <a href="tel:+${WA}">${PHONE}</a> or <a href="${esc(ask)}" rel="noopener">order on WhatsApp</a>.</p></div>`;
    // 3) PCPB link out (regulated categories only)
    const bc = (h.match(/<nav class="bc">[\s\S]*?<\/nav>/) || [''])[0];
    const slugs = [...bc.matchAll(/href="\/c\/([^"]+)\.html"/g)].map(x => decodeURIComponent(x[1]));
    const pcpb = slugs.some(s => PCPB.has(s)) ? `<div class="box"><h2 style="margin-top:0">Check that the product is registered</h2><p>In Kenya only pest control products registered by the Pest Control Products Board (PCPB) may be sold and used. Compare the registration number on the pack with the lists on the <a href="https://pcpb.go.ke" target="_blank" rel="noopener">PCPB website</a> before you use any chemical.</p></div>` : '';
    // 4) visible FAQ (store facts only)
    const pm = h.match(/product:price:amount" content="(\d+)"/);
    const priceTxt = pm ? `${h.includes('by size</h2>') ? 'from ' : ''}KSh ${Number(pm[1]).toLocaleString('en-KE')}` : '';
    const faq = [
      [`How can I buy ${name} in Kenya?`, `Order ${name} online at Stermont Arcade, pay by M-Pesa and get delivery to all 47 counties in Kenya. You can also order on WhatsApp.`],
      [`Do you deliver ${name} outside Nairobi?`, `Yes. We deliver to Nairobi, Kiambu, Nakuru, Kisumu, Eldoret, Mombasa and all 47 counties, usually within 1 to 3 days. We confirm the delivery fee before you pay.`],
      ...(priceTxt ? [[`What is the price of ${name}?`, `${name} costs ${priceTxt} at Stermont Arcade. Check the product price above for the size you want.`]] : []),
      [`Can I pick up ${name} in Nairobi?`, `Yes. Collect at The Sarit Centre, Karuna Road, Westlands, open daily 8 AM to 8 PM. Confirm stock on WhatsApp first.`]
    ];
    const faqBox = `<div class="box"><h2 style="margin-top:0">Frequently asked questions</h2>${faq.map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}</div>`;
    const add = local + '\n' + pcpb + '\n' + faqBox + '\n';
    const dRe = /(<div class="box"><h2 style="margin-top:0">Delivery to Nairobi &amp; All 47 Counties<\/h2>[\s\S]*?<\/div>)/;
    h = dRe.test(h) ? h.replace(dRe, m => m + '\n' + add) : h.replace('<div class="stk"', () => add + '<div class="stk"');

    if (h !== before) {
      h = h.replace('<div class="stk"', () => MARK + '<div class="stk"').replace('</head>', () => STYLE + '</head>');
      writeFileSync(file, h); done++;
    }
  } catch (e) { console.log('skip rich content', f, e.message); }
}
console.log(`Rich content (size table, local delivery, PCPB link, FAQ) added to ${done} product page(s).`);
