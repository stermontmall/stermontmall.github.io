/* Official product-publishing rulebook for the admin portal.
   Source of truth: Neon table public.publishing_rules (key publish_products is the governing rule).
   Read through the Neon Data API with the staff member's Neon Auth session (same session as /neon-admin.html).
   Staff-only: RLS policy publishing_rules_admin_read allows select when is_store_admin() is true. */
(function () {
  var D = document;
  var AUTH = 'https://ep-dry-butterfly-bhytt90y.neonauth.c-10.eu-central-1.aws.neon.tech/stermont/auth';
  var DATA = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1';
  var GOVERNING_KEY = 'publish_products';
  var authClient = null;
  function el(tag, cls, text) {
    var n = D.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function getAuth() {
    if (authClient) return Promise.resolve(authClient);
    return import('https://esm.sh/@neon/auth').then(function (m) {
      authClient = m.createAuthClient(AUTH, { fetchOptions: { credentials: 'include' } });
      return authClient;
    });
  }
  function token() {
    return getAuth().then(function (a) {
      return a.token().then(function (r) {
        var t = r && r.data && r.data.token;
        if (t) return t;
        return a.getSession().then(function (s) {
          var t2 = s && s.data && s.data.session && s.data.session.token;
          if (!t2) throw new Error('NO_SESSION');
          return t2;
        });
      });
    }).catch(function () { throw new Error('NO_SESSION'); });
  }
  function request() {
    return token().then(function (jwt) {
      return fetch(DATA + '/publishing_rules?select=key,version,title,content,updated_at&order=key.asc', {
        headers: { Authorization: 'Bearer ' + jwt }
      });
    }).then(function (r) {
      if (r.status === 401) throw new Error('NO_SESSION');
      if (r.status === 403) throw new Error('Your account is not a store admin in Neon, so it cannot read the rulebook.');
      if (!r.ok) throw new Error('Could not read the official rulebook (' + r.status + ').');
      return r.json();
    }).then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) throw new Error('No publishing rules were returned from Neon. Check that you are signed in as a store admin.');
      var gov = rows.filter(function (x) { return x.key === GOVERNING_KEY; })[0];
      if (!gov) throw new Error('The governing rule (' + GOVERNING_KEY + ') is missing from Neon public.publishing_rules.');
      return { governing: gov, others: rows.filter(function (x) { return x.key !== GOVERNING_KEY; }) };
    });
  }
  function card(title, note) {
    var c = el('section', 'card');
    c.appendChild(el('h3', null, title));
    if (note) c.appendChild(el('p', 'meta', note));
    return c;
  }
  function ruleBox(row, open) {
    var details = el('details');
    if (open) details.open = true;
    details.appendChild(el('summary', null, row.title + ' · key ' + row.key + ' · version ' + row.version));
    var pre = el('pre');
    pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font: .84rem/1.55 ui-monospace,monospace;max-height:70vh;overflow:auto;background:#f8f7fc;border:1px solid var(--ln);border-radius:10px;padding:.8rem';
    pre.textContent = String(row.content || 'The rule text is empty.');
    details.appendChild(pre);
    return details;
  }
  function mount(root) {
    root.textContent = '';
    var top = card('Official product-publishing rules', 'Read directly from the Neon table public.publishing_rules. This is the same source of truth used by working sessions; there is no separate admin copy to edit.');
    var refresh = el('button', 'btn alt sm', '↻ Refresh official rules');
    refresh.type = 'button';
    var status = el('p', 'meta', 'Loading the official rulebook…');
    top.appendChild(refresh);
    top.appendChild(status);
    root.appendChild(top);
    var body = el('div');
    root.appendChild(body);
    function draw(data) {
      body.textContent = '';
      var g = data.governing;
      var main = card('Governing rule · ' + g.title, 'Pricing, stock defaults, descriptions, photos and publishing checks are all defined in this rule. The database triggers enforce the price and inventory defaults on every new product.');
      main.appendChild(ruleBox(g, true));
      body.appendChild(main);
      if (data.others.length) {
        var more = card('Supplementary rules', 'The governing rule above wins on any conflict.');
        data.others.forEach(function (row) { more.appendChild(ruleBox(row, false)); });
        body.appendChild(more);
      }
      status.textContent = 'Official rule loaded · ' + GOVERNING_KEY + ' version ' + g.version + ' · Updated ' + (g.updated_at ? new Date(g.updated_at).toLocaleString('en-KE') : 'timestamp unavailable');
      status.style.color = '#15803d';
    }
    function needSignIn() {
      body.textContent = '';
      var c = card('Sign in to Neon to view the rulebook', 'The rulebook now lives in Neon. Sign in once on the Neon admin page, then come back and press Refresh.');
      var a = el('a', 'btn sm', 'Open Neon admin sign-in');
      a.href = '/neon-admin.html';
      a.target = '_blank';
      a.rel = 'noopener';
      c.appendChild(a);
      body.appendChild(c);
      status.textContent = 'Neon sign-in needed.';
      status.style.color = '';
    }
    function load() {
      refresh.disabled = true;
      status.textContent = 'Loading the official rulebook…';
      status.style.color = '';
      request().then(draw).catch(function (e) {
        if (e && e.message === 'NO_SESSION') { needSignIn(); return; }
        body.textContent = '';
        status.textContent = e.message;
        status.style.color = '';
      }).then(function () { refresh.disabled = false; });
    }
    refresh.addEventListener('click', load);
    load();
  }
  window.STMPublishingRules = { mount: mount };
})();
