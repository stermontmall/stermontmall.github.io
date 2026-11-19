/* Staff-only read view of the canonical Supabase product pricing rule. */
(function () {
  'use strict';
  function node(tag, cls, value) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (value != null) el.textContent = value;
    return el;
  }
  function money(value) {
    var n = Number(value);
    return Number.isFinite(n) ? 'KSh ' + n.toLocaleString('en-KE') : '—';
  }
  function mount(root) {
    root.textContent = '';
    var card = node('section', 'card');
    card.appendChild(node('h2', null, 'Product pricing rules'));
    card.appendChild(node('p', 'meta', 'Canonical staff reference · read-only · loaded from Supabase'));
    card.appendChild(node('p', 'meta', 'These rules govern new product and pack-variant pricing. They are not a public customer promotion.'));
    root.appendChild(card);
    var status = node('p', 'meta', 'Loading the current approved rule…');
    card.appendChild(status);

    window.STMAdmin.api('/rest/v1/publishing_rules?key=eq.autonomous_bulk_product_publishing&select=key,rule_text,config,updated_at')
      .then(function (response) {
        if (!response.ok) throw new Error('Supabase returned HTTP ' + response.status + '.');
        return response.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) throw new Error('The canonical pricing rule was not found in Supabase.');
        var row = rows[0], cfg = row.config || {}, tiers = Array.isArray(cfg.markup_tiers) ? cfg.markup_tiers : [];
        status.textContent = 'Rule source: Supabase public.publishing_rules · key: ' + row.key +
          (row.updated_at ? ' · Updated: ' + new Date(row.updated_at).toLocaleString('en-KE') : '');

        var table = node('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;margin:.6rem 0 1rem';
        var head = node('tr');
        ['Verified baseline cost (KES)', 'Markup'].forEach(function (label) {
          var th = node('th', null, label); th.style.cssText = 'text-align:left;padding:.55rem;border-bottom:1px solid #e6e2f2'; head.appendChild(th);
        });
        var thead = node('thead'); thead.appendChild(head); table.appendChild(thead);
        var body = node('tbody');
        tiers.forEach(function (tier) {
          var tr = node('tr');
          [tier.baseline || '—', (tier.markup_pct != null ? tier.markup_pct + '%' : '—')].forEach(function (value) {
            var td = node('td', null, String(value)); td.style.cssText = 'padding:.55rem;border-bottom:1px solid #e6e2f2'; tr.appendChild(td);
          });
          body.appendChild(tr);
        });
        table.appendChild(body);
        card.appendChild(node('h3', null, 'Four-tier markup'));
        card.appendChild(table);

        var facts = [
          ['Supplier-price source', cfg.baseline_cost_source || 'Use the approved rulebook source directory.'],
          ['Minimum margin floor', (cfg.min_margin_pct != null ? cfg.min_margin_pct : cfg.minimum_net_margin_pct || 15) + '% above verified baseline cost'],
          ['Price rounding', cfg.rounding_rule || ('Nearest KSh ' + (cfg.round_to_kes || 50))],
          ['Minimum storefront price', money(cfg.min_price_kes || cfg.minimum_storefront_price_kes || 200)],
          ['Currency', 'KES / KSh'],
          ['Syngenta', cfg.syngenta_exclusion || 'Excluded from repricing unless the owner explicitly instructs otherwise.']
        ];
        var list = node('dl');
        list.style.cssText = 'display:grid;grid-template-columns:minmax(125px, .8fr) minmax(0,1.7fr);gap:.55rem .8rem;margin:.4rem 0';
        facts.forEach(function (fact) {
          var dt = node('dt', null, fact[0]); dt.style.fontWeight = '700';
          var dd = node('dd', null, String(fact[1])); dd.style.margin = '0';
          list.appendChild(dt); list.appendChild(dd);
        });
        card.appendChild(list);

        card.appendChild(node('h3', null, 'Required calculation order'));
        var steps = [
          'Verify the exact product/model and pack-size baseline in Kenyan shillings.',
          'Use the applicable tier: below KSh 20,000 = 30%; KSh 20,000–39,999 = 25%; KSh 40,000–60,000 = 20%; above KSh 60,000 = 17.5%.',
          'Apply the minimum 15% floor above the verified baseline cost.',
          'Round to the nearest KSh 50.',
          'Enforce the KSh 200 minimum storefront price.',
          'Record the baseline, source URL, tier, rounding and final selling price. Never invent a price.'
        ];
        var ol = node('ol');
        steps.forEach(function (step) { ol.appendChild(node('li', null, step)); });
        card.appendChild(ol);

        var match = String(row.rule_text || '').match(/### 4\. PRICING:[^\n]*[\s\S]*?(?=\n### 5\.|$)/);
        var details = node('details');
        details.style.marginTop = '1rem';
        details.appendChild(node('summary', null, 'View the exact pricing section stored in Supabase'));
        var pre = node('pre');
        pre.textContent = match ? match[0] : 'Pricing section could not be extracted. See the full canonical rule in Supabase.';
        pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;background:#f6f4fb;padding:.8rem;border-radius:10px;font:13px/1.5 ui-monospace,monospace';
        details.appendChild(pre);
        card.appendChild(details);
      })
      .catch(function (error) {
        status.textContent = 'Could not load the live rule: ' + error.message;
        status.className = 'err';
        card.appendChild(node('p', 'meta', 'Access is restricted to authenticated staff. Check the staff read policy on public.publishing_rules and refresh.'));
      });
  }
  window.STMPricingRules = { mount: mount };
})();
