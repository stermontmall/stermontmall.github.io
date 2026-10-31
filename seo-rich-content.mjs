// Stermont Arcade - rich-content pass for product pages (runs from seo-overrides.mjs, after seo-product-extras.mjs).
// Adds, using only facts the page already has or facts that are true for the whole store (shipping.html, nairobi.html):
// 1) "Price of <product> by size" table when a product has several pack sizes (replaces the plain "Available sizes" list).
// 2) "How to order <product> in Kenya" box with the phone / WhatsApp number, the delivery towns and a 3-step "how to order".
// 3) For PCPB-regulated categories only: a link out to the Pest Control Products Board website to check registration.
// 4) A visible "Frequently asked questions" box (price, delivery, M-Pesa, how to buy) so the FAQ schema on the page matches what visitors can read.
// It never invents dosages, ingredients or coverage: those come from each product's own description (Supabase) and the structured sections of seo-product-extras.mjs.
// Safe by design: every page is wrapped in try/catch, a page that already has the marker is skipped. To switch it off, delete the import line in seo-overrides.mjs.
// wip-index-quality: the leading "Buy " of the H1 is stripped from the product name before it is reused in headings and FAQ text,
// otherwise headings read "Buy Buy Original ..." and the page looks machine-made to Google.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const WA = '254748888230', PHONE = '+254 748 888 230';
const MARK = '<!--stm-rich-->';
const PCPB = new Set(['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals',
  'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators']);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const STYLE = '<style>.pt table{border-collapse:collapse;width:100%}.pt th,.pt td{border:1px solid #e6e1f5;padding:.45rem .6rem;text-align:left;vertical-align:top}.pt th{background:#f1ebff}.pw{overflow-x:auto}.how ol{margin:.3rem 0 .6rem;padding-left:1.2rem}.how li{margin:.25rem 0}</style>';

let done = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK) || !/<h1>/.test(h)) continue;   // already done, or a redirect stub
    const before = h;
    const name = unesc(h.match(/<h1>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '').trim()).replace(/^Buy\s+/i, '');
    const nm = esc(name);

    // 1) price table by size
    h = h.replace(/<div class="box"><h2 style="margin-top:0">Available sizes<\/h2><ul class="g">([\s\S]*?)<\/ul><\/div>/, (m, inner) => {
      const rows = [...inner.matchAll(/<li>([\s\S]*?)<span>([\s\S]*?)<\/span><small class="(ok|no)">([\s\S]*?)<\/small>(?: <a href="([^"]*)">[\s\S]*?<\/a>)?<\/li>/g)];
      if (!rows.length) return m;
      return `<div class="box pt"><h2 style="margin-top:0">Price of ${nm} by size</h2><div class="pw"><table><thead><tr><th>Size</th><th>Price</th><th>Availability</th><th>Order</th></tr></thead><tbody>` +
        rows.map(r => `<tr><td>${r[1]}</td><td>${r[2]}</td><td class="${r[3]}">${r[4]}</td><td>${r[5] ? `<a href="${r[5]}">WhatsApp</a>` : '–'}</td></tr>`).join('') + '</tbody></table></div></div>';
    });

    // 2) local delivery + how to order (the delivery times already sit in the "Delivery to Nairobi & All 47 Counties" box, so they are not repeated here)
    const ask = `https://wa.me/${WA}?text=${encodeURIComponent(`Hello Stermont Arcade, I want to order ${name}. My town is: `)}`;
    const local = `<div class="box how"><h2 style="margin-top:0">How to order ${nm} in Kenya</h2>` +
      `<p>We deliver to Nairobi, Kiambu, Nakuru, Kisumu, Eldoret, Mombasa and every other county in Kenya.</p>` +
      `<ol><li>Add the product to your cart, or message us on WhatsApp.</li><li>Pay by M-Pesa and enter the M-Pesa code from your SMS.</li><li>We confirm the delivery fee for your town before you pay, then dispatch your order.</li></ol>` +
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
