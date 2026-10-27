/* Stermont Office: read_product_page tool.
   Lets the builder read a Jumia Kenya product page, category page or search result through the read-page Supabase function
   (a browser cannot read Jumia, the server can). Only signed-in staff can use it, and only https://www.jumia.co.ke pages are read.
   It returns facts only (name, brand, pack text, prices), never photos. Prices read this way are the COST (COGS) of the item.
   Loaded by builder-products.js. If this file fails to load, or Jumia refuses the server, the builder falls back to screenshots. */
(function () {
  'use strict';
  var W = window, D = document;
  var BP = W.BuilderProducts; if (!BP || W.__stmReadPage) return;
  W.__stmReadPage = 1;
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', PK = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', SK = 'stm_admin_session';
  var SIGNED_OUT = 'The owner is signed out of the Admin console on this device. Tell them to open /admin.html, sign in, then come back here and ask again.';

  function tok() {
    var s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
    if (!s || !s.access_token) return Promise.reject(new Error(SIGNED_OUT));
    if (Date.now() < s.exp) return Promise.resolve(s.access_token);
    return fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: PK, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) }).then(function (r) {
      if (!r.ok) throw new Error('The admin session expired. Tell the owner to open /admin.html, sign in again, then come back here.');
      return r.json();
    }).then(function (j) {
      s.access_token = j.access_token; s.refresh_token = j.refresh_token; s.exp = Date.now() + (j.expires_in || 3600) * 1000 - 60000;
      try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
      return s.access_token;
    });
  }

  function readPage(a) {
    a = a || {};
    var body = {};
    if (a.url) body.url = String(a.url).trim(); else if (a.search) body.search = String(a.search).trim();
    if (!body.url && !body.search) return Promise.reject(new Error('Send a Jumia Kenya link as url, or a product name as search.'));
    return tok().then(function (t) {
      var ac = typeof AbortController === 'function' ? new AbortController() : null, to = ac ? setTimeout(function () { ac.abort(); }, 28000) : 0;
      return fetch(SB + '/functions/v1/read-page', { method: 'POST', headers: { apikey: PK, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined })
        .then(function (r) { clearTimeout(to); return r.text().then(function (tx) { var j; try { j = JSON.parse(tx); } catch (e) { j = null; } return { st: r.status, j: j }; }); },
          function () { clearTimeout(to); throw new Error('The page reader did not answer. Ask the owner to attach screenshots of the page instead.'); });
    }).then(function (x) {
      var j = x.j;
      if (!j) throw new Error('The page reader gave no answer (' + x.st + '). Ask the owner to attach screenshots of the page instead.');
      if (!j.ok) {
        if (j.blocked) return { ok: false, blocked: true, note: 'Jumia refused the server. Do not guess anything. Ask the owner to attach screenshots of the product page (pack sizes and prices visible) or paste the text.' };
        throw new Error(j.error || 'The page could not be read.');
      }
      return {
        ok: true, url: j.url, title: j.title, products: j.products, listings: j.listings, page_text: j.text,
        note: 'Read from the live page. Use only what is shown here. A price here is the COST (COGS) unless the owner says otherwise. If a pack size or price is not shown, leave it out and ask the owner. These are facts only: the photos still come from the owner\'s attachments.'
      };
    });
  }

  BP.tools.read_product_page = readPage;
  BP.decls.push({
    name: 'read_product_page',
    description: 'Read a Jumia Kenya (https://www.jumia.co.ke) product page, category page or search result and return its product names, brands, pack text and prices. Works only for jumia.co.ke and only while the owner is signed in at /admin.html. Give either url (a Jumia link the owner sent) or search (a product name). It never returns photos. If it says blocked, ask for screenshots instead.',
    parameters: { type: 'object', properties: {
      url: { type: 'string', description: 'A https://www.jumia.co.ke link the owner sent' },
      search: { type: 'string', description: 'A product name to search on Jumia Kenya (use when there is no link)' }
    }, required: [] }
  });

  var oldInfo = BP.info;
  BP.info = function () {
    return oldInfo() + '\nREADING JUMIA LINKS: you CAN read Jumia Kenya pages with read_product_page, but ONLY https://www.jumia.co.ke links or a product name to search there. Use it when the owner sends a Jumia link or asks you to check a Jumia price or pack. Report only what the tool returned, never say you read a page the tool did not return, and never guess a missing pack or price. If the tool says blocked or fails, say so in one sentence and ask for screenshots. Prices from Jumia are the COST (COGS), not the selling price. Every other website still cannot be opened.';
  };
})();
