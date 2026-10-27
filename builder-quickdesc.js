/* Stermont Office: fast product descriptions.
   Writing 300+ words for every item with a free AI model is what makes a big upload take 10 minutes. With this file the AI only writes a SHORT
   "highlights" text per item (a catchy tagline and 3 to 6 facts, one per line). The tool then builds the full description itself, instantly:
   catchy title, opening line with the Google search phrase, subtitles, features, usage and storage, price in Kenya, how to order, FAQ and specifications.
   It only uses the name, pack size, category and the facts given, so nothing is invented. Descriptions the AI writes in full still work as before.
   Loaded by builder-sitepacks.js. If this file fails to load, the builder works as before. */
(function () {
  'use strict';
  var BP = window.BuilderProducts; if (!BP || window.__stmQuickDesc) return;
  window.__stmQuickDesc = 1;
  function words(t) { t = String(t == null ? '' : t).trim(); return t ? t.split(/\s+/).length : 0; }
  function lines(t) { return String(t || '').split(/\n+/).map(function (l) { return l.replace(/^[\s*\-•\d.)]+/, '').trim(); }).filter(Boolean); }
  function dot(t) { t = String(t || '').trim(); return t && !/[.!?]$/.test(t) ? t + '.' : t; }
  var CHEM = /pest|fumig|insect|fungic|herbic|rodent|termite|cockroach|bed bug|mosquito|fly|disinfect|veterinary|vet|agro|adjuvant|fertili|sprayer|seed/i;

  function compose(it, min, max) {
    var name = String(it.name || '').trim(), pack = String(it.pack_size || '').trim(), cat = String(it.category || '').trim();
    var full = name + (pack ? ' ' + pack : ''), hl = lines(it.highlights), tag = hl.shift() || ('A trusted choice from Stermont Arcade');
    var chem = CHEM.test(cat), catL = cat || 'products', o = [];
    o.push(full + ' - ' + dot(tag).replace(/\.$/, ''));
    o.push('Buy ' + full + ' online in Kenya at Stermont Arcade. ' + dot(tag) + ' Pay by M-Pesa and get delivery to all 47 counties, including Nairobi, Mombasa, Kisumu, Nakuru and Eldoret.');
    o.push('Why Choose ' + name);
    o.push(hl.length ? hl.map(dot).join(' ') : ('Shoppers in Kenya choose ' + name + ' from Stermont Arcade because it is clearly described, fairly priced and delivered to your door.'));
    o.push('Key Features');
    (hl.length ? hl : ['Genuine product sold by Stermont Arcade']).forEach(function (f) { o.push(f.replace(/\.$/, '')); });
    if (pack) o.push('Pack size: ' + pack);
    o.push('Category: ' + catL);
    o.push('Delivered to all 47 counties');
    o.push('Pay by M-Pesa');
    o.push('Where ' + name + ' Fits');
    o.push(chem
      ? 'This product from our ' + catL + ' range is bought by farmers, shop owners and households across Kenya. Choose the ' + (pack ? pack + ' pack' : 'pack size') + ' that matches the area, crop, animals or space you need to treat, so you do not run short in the middle of a job. If you are not sure which product suits your problem, message our team on WhatsApp before you order and we will help you choose.'
      : 'This product is bought by homes, offices and small businesses across Kenya who want dependable ' + catL.toLowerCase() + ' without wasting time moving between shops. Choose the ' + (pack ? pack + ' option' : 'option') + ' that fits your need and budget. If you are not sure which one suits you, message our team on WhatsApp before you order and we will help you choose.');
    o.push('How to Use and Handle ' + name);
    o.push(chem
      ? 'Always read and follow the label and the manufacturer instructions before you use the product. Wear suitable protective clothing, mix and apply exactly as the label says, and never mix with other products unless the label allows it. Keep it away from children, pets, food and water sources, and wash your hands after handling.'
      : 'Check the product and the packaging when it arrives, and follow the manufacturer guide that comes with it for setup, use and care. Keep the receipt and the packaging in case you need support or a return.');
    o.push('Storage and Safety');
    o.push(chem
      ? 'Store ' + full + ' in its original, tightly closed container in a cool, dry place, away from direct sunlight, food, animal feed and children. Never reuse the empty container for food or drink.'
      : 'Store ' + full + ' in a cool, dry place, away from moisture, heat and direct sunlight, and keep the packaging safe so the product stays in good condition.');
    o.push(name + ' Price in Kenya');
    o.push('The current price of ' + full + ' is shown on this page in Kenya shillings, with the previous price so you can see your saving. Stermont Arcade is an online store in Nairobi, so you can buy ' + name + ' from anywhere in Kenya without travelling to town.');
    o.push('How to Order from Stermont Arcade');
    o.push('Add ' + full + ' to your cart, enter your delivery details, and pay with M-Pesa on Paybill 714777 using the account number shown at checkout. We confirm your order and deliver it to your county. Questions about the order are answered on WhatsApp.');
    o.push('Frequently Asked Questions');
    o.push('What is ' + full + '?');
    o.push(dot(tag) + ' It is sold in the ' + catL + ' category at Stermont Arcade.');
    o.push('Where can I buy ' + name + ' in Nairobi or Kenya?');
    o.push('You can buy ' + full + ' online at Stermont Arcade (stermontarcade.co.ke) and get it delivered to all 47 counties.');
    o.push('How do I pay and when do I get it?');
    o.push('Pay by M-Pesa at checkout. Delivery time depends on your county, and our team confirms it with you on WhatsApp.');
    o.push('Specifications');
    o.push('Product: ' + name);
    if (pack) o.push('Pack Size: ' + pack);
    o.push('Category: ' + catL);
    var pool = [
      'Why Buy ' + full + ' Online',
      'Buying ' + full + ' online saves you the time and transport cost of visiting several shops. You see the product, the pack size and the price before you pay, and you can ask our team any question on WhatsApp.',
      'Support from Stermont Arcade',
      'If you have any question about ' + name + ', its use or your order, contact Stermont Arcade on +254 748 888 230 or support@stermontarcade.co.ke and we will gladly help.'
    ];
    var text = o.join('\n'), i = 0;
    while (words(text) < min && i < pool.length) { text += '\n' + pool[i++]; }
    if (max && words(text) > max) {   // too long: cut the extra sections from the end until it fits
      var arr = text.split('\n');
      while (arr.length > 8 && words(arr.join('\n')) > max) arr.pop();
      text = arr.join('\n');
    }
    return text;
  }

  var orig = BP.tools.post_products;
  BP.tools.post_products = function (a) {
    a = a || {};
    var min = a.min_description_words != null ? Math.max(0, parseInt(a.min_description_words, 10) || 0) : 300, max = Math.max(0, parseInt(a.max_description_words, 10) || 0);
    (Array.isArray(a.items) ? a.items : []).forEach(function (it) {
      if (it && it.highlights && words(it.description) < Math.max(min, 1)) it.description = compose(it, min, max);
    });
    return orig(a);
  };
  BP.decls.forEach(function (d) {
    if (d.name !== 'post_products') return;
    try {
      var p = d.parameters.properties.items.items.properties;
      p.highlights = { type: 'string', description: 'FAST WAY (use this for every item): a catchy one-line tagline on the first line, then 3 to 6 short facts about the product, one per line (what it is, who uses it, what it is for), only facts from the photo, the screenshots or the owner. The tool then builds the full 300+ word Google-friendly description by itself. Do not write a long description when you send highlights' };
      p.description.description = 'Only when the owner wants a custom full text. Normally leave it out and send highlights instead, which is much faster. ' + p.description.description;
      d.description += ' SPEED: for each item send "highlights" (a tagline and 3 to 6 short fact lines) instead of a long description. The tool builds the full description itself, so a big upload takes seconds, not minutes.';
    } catch (e) {}
  });
  /* written in right now so it runs last and checks every photo against its item before the Post card */
  if (document.readyState === 'loading') { try { document.write('<scr' + 'ipt src="/builder-photocheck.js?v=1"></scr' + 'ipt>'); } catch (e) {} }
})();
