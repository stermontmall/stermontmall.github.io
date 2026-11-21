/* Official pricing and product-posting rulebook for the admin portal.
   Reads the staff-protected canonical row in public.publishing_rules. */
(function () {
  var D = document;
  function A() { return window.STMAdmin; }
  function el(tag, cls, text) {
    var n = D.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function request() {
    return A().ready().then(function () {
      return A().api('/rest/v1/publishing_rules?select=key,rule_text,config,updated_at&key=eq.autonomous_bulk_product_publishing');
    }).then(function (r) {
      if (r.status === 401) throw new Error('Your admin session expired. Sign in again.');
      if (r.status === 403) throw new Error('Your staff account cannot read the official publishing rule. Check the Supabase staff read policy.');
      if (!r.ok) throw new Error('Could not read the official rulebook (' + r.status + ').');
      return r.json();
    }).then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) throw new Error('The canonical publishing rule is missing from Supabase.');
      return rows[0];
    });
  }
  function card(title, note) {
    var c = el('section', 'card');
    c.appendChild(el('h3', null, title));
    if (note) c.appendChild(el('p', 'meta', note));
    return c;
  }
  function mount(root) {
    root.textContent = '';
    var top = card('Official pricing & product-posting rules', 'This page reads the staff-protected rule directly from Supabase. It is the same source of truth used by working sessions; no separate admin copy needs editing.');
    var refresh = el('button', 'btn alt sm', '↻ Refresh official rules');
    refresh.type = 'button';
    var status = el('p', 'meta', 'Loading the official rulebook…');
    top.appendChild(refresh);
    top.appendChild(status);
    root.appendChild(top);
    var summary = el('div');
    root.appendChild(summary);
    function draw(row) {
      summary.textContent = '';
      var cfg = row.config || {};
      var tiers = Array.isArray(cfg.markup_tiers) ? cfg.markup_tiers : [];
      var p = card('1 · Pricing formula', 'Enter the verified baseline cost in KES. The database applies the same formula when a new product row is inserted.');
      var tableWrap = el('div');
      tableWrap.style.overflowX = 'auto';
      var table = el('table', 'cx-t');
      var thead = el('thead'), tr = el('tr');
      ['Verified baseline cost', 'Markup'].forEach(function (x) { tr.appendChild(el('th', null, x)); });
      thead.appendChild(tr); table.appendChild(thead);
      var tbody = el('tbody');
      tiers.forEach(function (tier) {
        var rowEl = el('tr');
        rowEl.appendChild(el('td', null, String(tier.baseline || '')));
        rowEl.appendChild(el('td', null, String(tier.markup_pct) + '%'));
        tbody.appendChild(rowEl);
      });
      table.appendChild(tbody); tableWrap.appendChild(table); p.appendChild(tableWrap);
      p.appendChild(el('p', 'meta', 'Then enforce at least ' + String(cfg.min_margin_pct || cfg.minimum_net_margin_pct || 15) + '% above baseline cost, round to the nearest KSh ' + String(cfg.round_to_kes || 50) + ', and never price below KSh ' + String(cfg.min_price_kes || cfg.minimum_storefront_price_kes || 200) + '.'));
      summary.appendChild(p);

      var inv = card('2 · Mandatory inventory defaults', 'Every newly created product and pack variant receives these defaults automatically.');
      inv.appendChild(el('p', null, 'Initial stock: ' + String(cfg.stock_default || 1000) + ' pieces'));
      inv.appendChild(el('p', null, 'Low-stock alert: ' + String(cfg.low_stock_default || 20) + ' pieces'));
      inv.appendChild(el('p', null, 'Featured placement: OFF by default'));
      inv.appendChild(el('p', null, 'New products: saved hidden until the publishing checks pass'));
      summary.appendChild(inv);

      var gates = card('3 · Product-posting checks', 'These are required before a product is made live.');
      [
        'Skip Syngenta products for automatic pricing unless the owner explicitly instructs otherwise.',
        'Use an exact product/model and pack-size match; do not invent a price or substitute a similar product.',
        'Use a legitimate Kenyan supplier or manufacturer source and keep the exact source URL in the product handoff.',
        'Use a clean exact-product photo; allowed formats are JPEG, PNG and WebP, at least 500 × 500 pixels and over 15 KB.',
        'Upload the photo to Supabase Storage and verify that the saved object exists and is referenced in products.images.',
        'Do not publish when price, image, duplicate, product facts, or Kenyan regulatory checks fail.',
        'Write useful, original SEO content; target 800+ words only where verified facts support it. Include exactly four matching buyer FAQs when applicable.',
        'Use two or three relevant internal links and keep all product links customer-facing through the mobile-shell product-link helper.'
      ].forEach(function (x) { gates.appendChild(el('p', null, '• ' + x)); });
      summary.appendChild(gates);

      var rule = card('4 · Full canonical rulebook', 'The full rule text below is loaded from public.publishing_rules, not hardcoded in this page.');
      var details = el('details');
      var summaryText = el('summary', null, 'Open full rulebook');
      var pre = el('pre');
      pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font: .84rem/1.55 ui-monospace,monospace;max-height:70vh;overflow:auto;background:#f8f7fc;border:1px solid var(--ln);border-radius:10px;padding:.8rem';
      pre.textContent = String(row.rule_text || 'The rule text is empty.');
      details.appendChild(summaryText); details.appendChild(pre); rule.appendChild(details);
      summary.appendChild(rule);
      status.textContent = 'Official rule loaded · Updated ' + (row.updated_at ? new Date(row.updated_at).toLocaleString('en-KE') : 'timestamp unavailable') + ' · Database key: ' + row.key;
      status.style.color = '#15803d';
    }
    function load() {
      refresh.disabled = true;
      status.textContent = 'Loading the official rulebook…';
      request().then(draw).catch(function (e) {
        summary.textContent = '';
        status.textContent = e.message;
        status.style.color = '';
      }).then(function () { refresh.disabled = false; });
    }
    refresh.addEventListener('click', load);
    load();
  }
  window.STMPublishingRules = { mount: mount };
})();