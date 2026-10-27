/* Stermont AI Builder: read the packs and prices of products from a website the owner refers to.
   Adds the tool read_website_packs(url, product). It asks Gemini (with Google's URL reading) to open the page and list EVERY pack size
   and its price, so the AI can then send one post_products entry per pack (same name, different pack_size, own cost). The price found on
   the website is used as the COST (COGS); the admin Catalog method then adds the profit and the previous price, stock, alert and advert.
   Also adds the owner's rules for product descriptions (same style as items listed more than a week ago) and for Google ranking.
   Loaded by builder-products.js. If this file fails to load, the builder works without it. */
(function () {
  'use strict';
  var W = window, D = document;
  var BP = W.BuilderProducts; if (!BP || W.__stmSitePacks) return;
  W.__stmSitePacks = 1;
  var MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

  function val(id) { var e = D.getElementById(id); return e ? String(e.value || '').trim() : ''; }
  function clean(u) {
    u = String(u || '').trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); if (!/^https?:$/.test(x.protocol)) return ''; return x.href; } catch (e) { return ''; }
  }
  function ask(model, key, prompt) {
    var body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], tools: [{ url_context: {} }], generationConfig: { temperature: 0 } };
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Gemini error ' + r.status + ': ' + t.slice(0, 160)); });
      return r.json();
    }).then(function (j) {
      var c = j.candidates && j.candidates[0], t = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('\n') : '';
      if (!t.trim()) throw new Error('The website could not be read (empty answer)');
      return t.trim();
    });
  }

  function readSite(a) {
    a = a || {};
    var url = clean(a.url), key = val('gkey'), who = String(a.product || '').trim().slice(0, 120);
    if (!url) throw new Error('url is required: the web address the owner referred to');
    if (!key) throw new Error('The Gemini key is missing. Tell the owner to add it in Settings');
    var prompt = 'Open this web page: ' + url + '\n' +
      (who ? 'Find the product "' + who + '" on it (open the product page if the link is a list). ' : 'If the page is a product list or category, open every product page you can reach from it (up to 25 products). ') +
      'For EACH product return EVERY pack size / variation that is listed (for example 50 ml, 100 ml, 250 ml, 1 Litre, 5 Litres) with the price of each pack in Kenya shillings exactly as shown on the page. ' +
      'Include the packs that are only visible in the size selector, the variation drop-down or the price range. Do not invent any pack or price: if a price is not shown write null.\n' +
      'Answer ONLY with JSON in this shape: {"source":"' + url + '","products":[{"name":"","category":"","packs":[{"pack_size":"","price_kes":0}],"facts":"short facts printed on the page: brand, active ingredient, uses"}]}';
    var i = 0;
    function go() {
      return ask(MODELS[i], key, prompt).catch(function (e) {
        if (++i < MODELS.length) return go();
        throw new Error(e.message + '. The website may block reading. Ask the owner to paste or screenshot the pack and price list instead');
      });
    }
    return go().then(function (t) {
      var m = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim(), j = null;
      try { j = JSON.parse(m.slice(m.indexOf('{'), m.lastIndexOf('}') + 1)); } catch (e) {}
      if (!j || !Array.isArray(j.products) || !j.products.length) return { ok: false, note: 'Could not read any products from ' + url + '. Reply of the reader: ' + t.slice(0, 400) + '. Ask the owner to paste or screenshot the pack and price list.' };
      var n = 0; j.products.forEach(function (p) { n += (p.packs || []).length; });
      return { ok: true, source: url, products: j.products, note: 'Found ' + j.products.length + ' product(s) and ' + n + ' pack(s). Use each pack price as the COST of that pack in post_products (one entry per pack, same name, different pack_size). Call list_products first and add only the packs the shop does not have. Keep only facts from this result in descriptions.' };
    });
  }

  var decl = { name: 'read_website_packs', description: 'Open a website page the owner referred to (a product page or a category page) and return EVERY pack size of the product(s) with the price of each pack. Use it whenever the owner names a website or sends a web address for products. The price returned is used as the cost (COGS) of that pack in post_products. Pass product to look for one product on a list page.',
    parameters: { type: 'object', properties: { url: { type: 'string', description: 'Web address of the product page or category page the owner referred to' }, product: { type: 'string', description: 'Optional product name to find on that page' } }, required: ['url'] } };
  BP.decls.push(decl);
  BP.tools.read_website_packs = readSite;

  var RULES = '\n\nREADING THE REFERRED WEBSITE: when the owner names a website or sends a web address for products, call read_website_packs with that address (and the product name if one product is wanted). It returns every pack size and each pack\'s price. Then post EVERY pack that was found: one post_products entry per pack, same name, different pack_size, cost = the price found on the website. Do not skip small or large packs. Call list_products first and add only the packs the shop does not have yet. If the website cannot be read, say so in one sentence and ask the owner to paste or screenshot the pack and price list. This replaces the older note that you cannot open websites.' +
    '\nADVERTS FROM THE ADMIN CATALOG: every item you post or edit goes through the admin Catalog method. Packs are joined under one item (variant group, pack in the variant label), the selling price of each pack is cost plus the owner\'s profit rule rounded to KSh 50, the previous price shows the 6 to 12 percent discount, stock is 1000, the low-stock alert is 20, and featured is on so the item shows as an advert on the home page and in the top banner. Mention in one line which items became adverts.' +
    '\nPRODUCT DESCRIPTION STYLE (same as the items listed more than a week ago): copy the structure of the older descriptions. (1) The first line is a catchy title in this pattern: Brand Product Pack (size), then one strong opening paragraph that starts with "Buy [name] [pack] online in Kenya" and says what it does, who it is for, and that you pay by M-Pesa with delivery to all 47 counties. (2) Then several subtitles, each on its own line in Title Case and each followed by a short paragraph or one point per line: for example Why Choose [Product], Key Features, Where It Fits (or How It Works), How to Use, Handling and Storage, Specifications (with a Brand: line and Pack Size: line), and Frequently Asked Questions. Make each subtitle catchy and specific to the product, not generic. (3) Be creative: use vivid but honest wording, real-life situations of Kenyan farmers, shops and homes, and a clear reason to buy now. (4) Still follow the word count and the no-invented-facts rule: keep brand claims, strengths, dosages and certifications out unless the website or the owner gave them. Use only the facts from read_website_packs, the photo, the name and the owner.' +
    '\nGOOGLE RANKING RULE FOR EVERY DESCRIPTION: write it so the page ranks on Google Kenya. Put the main search phrase "Buy [exact product name] [pack] online in Kenya" in the first sentence. Use natural variations in the later subtitles: "[product] price in Kenya", "[product] [pack]", "[category] in Kenya", "where to buy [product] in Nairobi", plus delivery to all 47 counties and M-Pesa. Each product must have its own unique text: never copy the same paragraph into two products or two packs, and name the pack size in the text of each pack. Keep the keywords natural, no stuffing (the main phrase at most 3 times), include one Frequently Asked Questions section with 3 short question-and-answer pairs people really search for (what is it, how is it used, how do I order), and keep the product name exactly as in the title. Do not use markdown or bullets, as the store format requires.';
  var oldInfo = BP.info;
  BP.info = function () { return oldInfo() + RULES; };
})();
