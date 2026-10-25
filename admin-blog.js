/* Stermont Arcade · admin: Blogs & SEO.
   Mounted by admin.html through STMBlog.mount(containerEl).
   Three views: (1) every published blog post with an SEO check, (2) the daily writer's topic queue, (3) write a post yourself.
   Self-written posts are turned into a ready page (same layout as the daily writer) that you download and upload to the blog/ folder on GitHub;
   the existing "Build blog index and sitemap" workflow then lists it automatically. Nothing here publishes by itself.
   All text from the site or from the form is set with textContent or escaped before it is placed in a page. */
(function () {
  var D = document, SITE = 'https://stermontarcade.co.ke', REPO = 'https://github.com/stermontmall/stermontmall.github.io', DK = 'stm_blog_draft';
  var state = { posts: null, topics: null };

  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function words(s) { return (String(s).match(/\S+/g) || []).length; }
  function slugify(t) { return String(t).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, ''); }
  function inp(tag, attrs) { var i = D.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); }); i.style.cssText = 'width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff'; return i; }
  function ext(text, href) { var a = h('a', 'btn alt sm', text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function btn(text, cls, fn) { var b = h('button', 'btn ' + (cls || 'alt') + ' sm', text); b.type = 'button'; b.onclick = fn; return b; }
  function get(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function dom(t) { return new DOMParser().parseFromString(t, 'text/html'); }
  function pool(items, n, fn) {
    var i = 0;
    function next() { if (i >= items.length) return Promise.resolve(); return fn(items[i++]).then(next, next); }
    var ws = []; for (var k = 0; k < n; k++) ws.push(next());
    return Promise.all(ws);
  }

  /* ---------- data ---------- */
  function loadPosts() {
    if (state.posts) return Promise.resolve(state.posts);
    return get('blog/index.html').then(function (t) {
      var map = {}, out = [];
      dom(t).querySelectorAll('a[href]').forEach(function (a) {
        var u; try { u = new URL(a.getAttribute('href'), location.origin + '/blog/index.html'); } catch (e) { return; }
        var m = u.pathname.match(/^\/blog\/([a-z0-9][a-z0-9-]*)\.html$/i);
        if (!m || m[1].toLowerCase() === 'index') return;
        var txt = (a.textContent || '').replace(/\s+/g, ' ').trim(), p = map[m[1]];
        if (!p) { p = map[m[1]] = { slug: m[1], title: txt || m[1] }; out.push(p); } else if (p.title === p.slug && txt) p.title = txt;
      });
      state.posts = out; return out;
    });
  }
  function loadTopics() {
    if (state.topics) return Promise.resolve(state.topics);
    return get('blog-topics.json').then(function (t) { state.topics = (JSON.parse(t).topics || []); return state.topics; });
  }

  /* ---------- SEO check of a published post ---------- */
  function checkPost(doc) {
    var main = doc.querySelector('main') || doc.body, h1s = doc.querySelectorAll('h1');
    var h1 = h1s[0] ? h1s[0].textContent.replace(/\s+/g, ' ').trim() : '';
    var dm = doc.querySelector('meta[name="description"]'), desc = dm ? (dm.getAttribute('content') || '') : '';
    var cn = doc.querySelector('link[rel="canonical"]'), canon = cn ? (cn.getAttribute('href') || '') : '';
    var rb = doc.querySelector('meta[name="robots"]'), robots = rb ? (rb.getAttribute('content') || '').toLowerCase() : '';
    var wc = words(main.textContent), h2 = main.querySelectorAll('h2').length;
    var inl = main.querySelectorAll('p a[href^="/"], p a[href^="' + SITE + '"]').length, ld = false;
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { if (/"@type"\s*:\s*"(?:Blog|News)?Article"/.test(s.textContent)) ld = true; });
    var og = !!doc.querySelector('meta[property="og:title"]') && !!doc.querySelector('meta[property="og:image"]');
    var rows = [
      ['Headline 20 to 70 characters', h1.length >= 20 && h1.length <= 70, h1.length + ' characters'],
      ['Exactly one main heading (H1)', h1s.length === 1, h1s.length + ' found'],
      ['Search description 70 to 160 characters', desc.length >= 70 && desc.length <= 160, desc.length + ' characters'],
      ['Canonical link points to your site', canon.indexOf(SITE) === 0, 'missing or wrong'],
      ['Open to Google (no noindex)', robots.indexOf('noindex') < 0, 'page is set to noindex'],
      ['At least 500 words', wc >= 500, wc + ' words'],
      ['At least 3 section headings (H2)', h2 >= 3, h2 + ' found'],
      ['Links to a product or category page', inl >= 1, 'no links inside the text'],
      ['Article structured data', ld, 'missing'],
      ['Social sharing tags (title and image)', og, 'missing']
    ];
    var checks = rows.map(function (r) { return { label: r[0], ok: !!r[1], note: r[2] }; }), pass = checks.filter(function (c) { return c.ok; }).length;
    return { checks: checks, pass: pass, total: checks.length, fails: checks.length - pass, words: wc };
  }

  /* ---------- view 1: written posts ---------- */
  function postCard(p, auto) {
    var k = h('div', 'card'), top = h('div', 'top');
    top.appendChild(h('span', 'ref', p.title));
    var badge = h('span', 'badge b-pending', 'Checking…'); top.appendChild(badge); k.appendChild(top);
    k.appendChild(h('div', 'meta', '/blog/' + p.slug + '.html' + (auto ? ' · written by the daily writer' : '')));
    var det = h('div'); det.hidden = true; k.appendChild(det);
    var a = h('div', 'acts');
    a.appendChild(btn('SEO details', 'alt', function () { det.hidden = !det.hidden; }));
    a.appendChild(ext('View post', '/blog/' + p.slug + '.html'));
    k.appendChild(a); p.ui = { badge: badge, det: det }; return k;
  }
  function fillPost(p, res) {
    p.ui.badge.textContent = res.pass + '/' + res.total + ' SEO';
    p.ui.badge.className = 'badge ' + (res.fails === 0 ? 'b-paid' : res.fails <= 2 ? 'b-pending' : 'b-declined');
    p.ui.det.textContent = '';
    res.checks.forEach(function (c) { p.ui.det.appendChild(h('div', 'meta', (c.ok ? '✅ ' : '⚠️ ') + c.label + (c.ok ? '' : ' - ' + c.note))); });
    p.ui.det.appendChild(h('div', 'meta', 'Length: ' + res.words + ' words'));
  }
  function postsView(box) {
    var sum = h('div', 'card'), list = h('div'); box.appendChild(sum); box.appendChild(list);
    sum.appendChild(h('div', 'meta', 'Loading your blog posts…'));
    Promise.all([loadPosts(), loadTopics().catch(function () { return []; })]).then(function (r) {
      var posts = r[0], auto = {}, done = 0, perfect = 0;
      r[1].forEach(function (t) { if (t.status === 'drafted') auto[t.slug] = 1; });
      if (!posts.length) { sum.textContent = ''; sum.appendChild(h('div', 'empty', 'No blog posts found yet.')); return; }
      function head() {
        sum.textContent = '';
        var t = h('div', 'tot'); t.appendChild(h('span', null, posts.length + ' blog post' + (posts.length === 1 ? '' : 's') + ' published')); sum.appendChild(t);
        sum.appendChild(h('div', 'meta', done < posts.length ? 'Checking SEO… ' + done + ' of ' + posts.length : perfect + ' pass every SEO check · ' + (posts.length - perfect) + ' could be improved. Tap "SEO details" on a post to see what to fix.'));
        var a = h('div', 'acts');
        a.appendChild(ext('Sitemap', 'sitemap.xml')); a.appendChild(ext('Search Console', 'https://search.google.com/search-console')); a.appendChild(ext('SEO playbook', REPO + '/blob/main/SEO-PLAYBOOK.md'));
        a.appendChild(btn('Refresh list', 'alt', function () { state.posts = null; state.topics = null; box.textContent = ''; postsView(box); }));
        sum.appendChild(a);
      }
      head();
      posts.forEach(function (p) { list.appendChild(postCard(p, !!auto[p.slug])); });
      pool(posts, 4, function (p) {
        return get('blog/' + p.slug + '.html').then(function (t) { var res = checkPost(dom(t)); fillPost(p, res); done++; if (!res.fails) perfect++; head(); },
          function () { p.ui.badge.textContent = 'Could not check'; p.ui.badge.className = 'badge b-declined'; done++; head(); });
      });
    }).catch(function () { sum.textContent = ''; sum.appendChild(h('div', 'err', 'Could not load the blog list from /blog/index.html.')); });
  }

  /* ---------- view 2: daily writer queue ---------- */
  function queueView(box) {
    box.appendChild(h('div', 'meta', 'Loading…'));
    loadTopics().then(function (ts) {
      box.textContent = '';
      var by = {}; ts.forEach(function (t) { by[t.status] = (by[t.status] || 0) + 1; });
      var c = h('div', 'card');
      c.appendChild(h('div', 'meta', 'The daily writer drafts one post a day at 09:00 Nairobi time from the next pending topic. Every draft arrives as a pull request on GitHub, so nothing goes live until you read it and merge it.'));
      var tot = h('div', 'tot'); tot.appendChild(h('span', null, 'Pending topics')); tot.appendChild(h('span', null, String(by.pending || 0))); c.appendChild(tot);
      c.appendChild(h('div', 'meta', 'Already drafted: ' + (by.drafted || 0) + ' · Paused: ' + (by.paused || 0)));
      if ((by.pending || 0) < 8) c.appendChild(h('div', 'meta', '⚠️ The queue is running low. Add more topics so the daily writer does not stop.'));
      var a = h('div', 'acts');
      a.appendChild(ext('Review draft posts', REPO + '/pulls')); a.appendChild(ext('Add or edit topics', REPO + '/edit/main/blog-topics.json')); a.appendChild(ext('Run the writer now', REPO + '/actions/workflows/blog-writer.yml'));
      c.appendChild(a); box.appendChild(c);
      var pend = ts.filter(function (t) { return t.status === 'pending'; });
      if (!pend.length) { box.appendChild(h('div', 'empty', 'No pending topics.')); return; }
      pend.slice(0, 20).forEach(function (t, i) {
        var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', (i === 0 ? 'Next: ' : '') + t.title));
        k.appendChild(top); k.appendChild(h('div', 'meta', (t.keywords || []).join(' · ')));
        box.appendChild(k);
      });
      if (pend.length > 20) box.appendChild(h('div', 'meta', '…and ' + (pend.length - 20) + ' more.'));
    }).catch(function () { box.textContent = ''; box.appendChild(h('div', 'err', 'Could not load blog-topics.json.')); });
  }

  /* ---------- view 3: write a post yourself ---------- */
  function blocksOf(body) {
    var out = [];
    String(body).replace(/\r/g, '').split(/\n{2,}/).forEach(function (b) {
      b = b.trim(); if (!b) return;
      var lines = b.split('\n');
      if (/^##\s+/.test(lines[0]) && lines.length > 1) { out.push(lines[0].trim()); var rest = lines.slice(1).join('\n').trim(); if (rest) out.push(rest); } else out.push(b);
    });
    return out;
  }
  function isH(b) { return /^##\s+/.test(b); }
  function plain(s) { return String(s).replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, '$1'); }
  function inline(s) {   /* escape first, then allow only [[/site-path|text]] links */
    return esc(s).replace(/\[\[(\/[A-Za-z0-9\-_\/\.]*)\|([^\]]+)\]\]/g, function (m, p, t) { return p.indexOf('//') > -1 ? t : '<a href="' + p + '">' + t + '</a>'; }).replace(/\[\[|\]\]/g, '');
  }
  function checkDraft(v) {
    var bl = blocksOf(v.body), wc = words(plain(v.body)), hs = bl.filter(isH).length, links = (v.body.match(/\[\[\/[^|\]]+\|[^\]]+\]\]/g) || []).length;
    var k = (v.keys.split(',')[0] || '').trim().toLowerCase(), first = (bl.filter(function (b) { return !isH(b); })[0] || '').toLowerCase();
    var rows = [
      ['Headline 20 to 70 characters', v.title.length >= 20 && v.title.length <= 70, v.title.length + ' so far'],
      ['Search description 70 to 160 characters', v.desc.length >= 70 && v.desc.length <= 160, v.desc.length + ' so far'],
      ['Web address: small letters, numbers, dashes', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) && v.slug.length >= 3, 'fix the address'],
      ['At least 500 words', wc >= 500, wc + ' words so far'],
      ['At least 3 section headings (start a line with ##)', hs >= 3, hs + ' so far'],
      ['Link to a product or category page', links >= 1, 'add [[/products.html|browse products]]']
    ];
    if (k) { rows.push(['Main keyword in the headline', v.title.toLowerCase().indexOf(k) > -1, 'add "' + k + '"']); rows.push(['Main keyword in the first paragraph', first.indexOf(k) > -1, 'add "' + k + '"']); }
    var checks = rows.map(function (r) { return { label: r[0], ok: !!r[1], note: r[2] }; });
    return { checks: checks, words: wc, pass: checks.filter(function (c) { return c.ok; }).length, total: checks.length };
  }
  var CSS = '*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}main{max-width:760px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}h1{font-size:1.6rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:1.6rem 0 .4rem}ul{padding-left:1.2rem}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:1rem 0}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}.meta{color:#6b6b80;font-size:.85rem}footer{max-width:760px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}';
  function ld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }
  function buildHtml(v) {
    var bl = blocksOf(v.body), wc = words(plain(v.body)), now = new Date(), iso = now.toISOString().slice(0, 10), url = SITE + '/blog/' + v.slug + '.html';
    var nice = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    var main = bl.map(function (b) {
      if (isH(b)) return '<h2>' + esc(plain(b.replace(/^##\s+/, ''))) + '</h2>';
      var lines = b.split('\n');
      if (lines.every(function (l) { return /^-\s+/.test(l.trim()); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.trim().replace(/^-\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + inline(b.replace(/\s*\n\s*/g, ' ')) + '</p>';
    }).join('\n');
    var t = esc(v.title), d = esc(v.desc), logo = SITE + '/logo.png';
    return '<!doctype html>\n<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<title>' + t + ' | Stermont Arcade</title><meta name="description" content="' + d + '">\n' +
      '<link rel="canonical" href="' + url + '"><meta name="robots" content="index, follow, max-image-preview:large">\n' +
      '<meta property="og:type" content="article"><meta property="og:site_name" content="Stermont Arcade"><meta property="og:locale" content="en_KE">\n' +
      '<meta property="og:title" content="' + t + '"><meta property="og:description" content="' + d + '"><meta property="og:url" content="' + url + '">\n' +
      '<meta property="og:image" content="' + logo + '"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#7c3aed">\n' +
      '<style>' + CSS + '</style>\n' +
      ld({ '@context': 'https://schema.org', '@type': 'Article', headline: v.title, datePublished: iso, dateModified: iso, inLanguage: 'en-KE', author: { '@type': 'Organization', name: 'Stermont Arcade' }, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: logo } }, mainEntityOfPage: url, image: logo }) + '\n' +
      ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], ['Buying guides', SITE + '/blog/'], [v.title, url]].map(function (x, i) { return { '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] }; }) }) + '\n' +
      '<script src="/analytics.js" defer></script></head><body>\n' +
      '<header><a href="' + SITE + '/">Stermont Arcade</a></header><main>\n' +
      '<nav class="bc"><a href="' + SITE + '/">Home</a> › <a href="/blog/">Buying guides</a> › ' + t + '</nav>\n' +
      '<h1>' + t + '</h1>\n<p class="meta">Updated ' + nice + ' · ' + Math.max(2, Math.round(wc / 200)) + ' min read</p>\n' + main + '\n' +
      '<a class="btn" href="/products.html">Browse all products</a>\n' +
      '<div class="box"><a href="https://wa.me/254748888230?text=Hello%20Stermont%20Arcade">Questions? Chat with us on WhatsApp</a></div>\n</main>\n' +
      '<footer>Stermont Arcade · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/254748888230">WhatsApp +254 748 888 230</a> · <a href="/shipping.html">Shipping</a> · <a href="/returns.html">Returns</a> · <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>\n';
  }
  function loadDraft() { try { return JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { return {}; } }
  function saveDraft(v) { try { localStorage.setItem(DK, JSON.stringify(v)); } catch (e) {} }

  function writeView(box) {
    var d = loadDraft(), slugTouched = !!d.slug;
    var card = h('div', 'card xform'); box.appendChild(card);
    var intro = h('div', 'meta full', 'Write a post in your own words. The checklist below shows how well it is set up for Google. Your draft saves automatically on this phone.'); card.appendChild(intro);
    var title = inp('input', { type: 'text', maxlength: '70', placeholder: 'e.g. How to choose a fridge for a Kenyan home' });
    var slug = inp('input', { type: 'text', maxlength: '70', placeholder: 'created from the headline' });
    var desc = inp('textarea', { rows: '3', maxlength: '200', placeholder: 'One or two sentences shown under your link on Google' });
    var keys = inp('input', { type: 'text', maxlength: '120', placeholder: 'main keyword first, e.g. fridge price in Kenya' });
    var body = inp('textarea', { rows: '16', placeholder: 'Write in plain paragraphs with a blank line between them.\n\n## Type two # and a space for a section heading\n\n- Start a line with a dash for a bullet\n\nLink to your shop like this: [[/products.html|browse all products]]' });
    title.value = d.title || ''; slug.value = d.slug || ''; desc.value = d.desc || ''; keys.value = d.keys || ''; body.value = d.body || '';
    function fld(label, input, extra) { var w = h('div'); w.appendChild(h('label', null, label)); w.appendChild(input); if (extra) w.appendChild(extra); return w; }
    var tc = h('div', 'meta'), dc = h('div', 'meta'), sc = h('div', 'meta');
    card.appendChild(fld('Headline', title, tc)); card.appendChild(fld('Web address', slug, sc));
    var wd = fld('Search description', desc, dc); wd.className = 'full'; card.appendChild(wd);
    var wk = fld('Keywords (optional, main one first)', keys); wk.className = 'full'; card.appendChild(wk);
    var wb = fld('Article', body); wb.className = 'full'; card.appendChild(wb);

    var chk = h('div', 'card'); box.appendChild(chk);
    var msg = h('div', 'err'); msg.hidden = true; box.appendChild(msg);
    function say(t, ok) { msg.textContent = t; msg.style.color = ok ? '#15803d' : ''; msg.style.background = ok ? '#dcfce7' : ''; msg.hidden = !t; }
    function read() { return { title: title.value.trim(), slug: slug.value.trim(), desc: desc.value.trim(), keys: keys.value.trim(), body: body.value }; }
    function update() {
      var v = read(); saveDraft(v);
      tc.textContent = v.title.length + ' / 70 characters'; dc.textContent = v.desc.length + ' / 160 characters'; sc.textContent = SITE.replace('https://', '') + '/blog/' + (v.slug || '…') + '.html';
      var r = checkDraft(v); chk.textContent = '';
      var t = h('div', 'tot'); t.appendChild(h('span', null, 'SEO checklist')); t.appendChild(h('span', null, r.pass + ' / ' + r.total)); chk.appendChild(t);
      r.checks.forEach(function (c) { chk.appendChild(h('div', 'meta', (c.ok ? '✅ ' : '⬜ ') + c.label + (c.ok ? '' : ' (' + c.note + ')'))); });
    }
    title.addEventListener('input', function () { if (!slugTouched) slug.value = slugify(title.value); update(); });
    slug.addEventListener('input', function () { slugTouched = true; update(); });
    [desc, keys, body].forEach(function (e) { e.addEventListener('input', update); });
    update();

    function ready() {
      var v = read();
      if (v.title.length < 10) { say('Add a headline first.'); return null; }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) || v.slug.length < 3) { say('The web address can only use small letters, numbers and dashes.'); return null; }
      if (v.desc.length < 40) { say('Add a search description (at least one sentence).'); return null; }
      if (words(v.body) < 150) { say('The article is too short. Write at least 150 words (500 or more ranks better).'); return null; }
      if (state.posts && state.posts.some(function (p) { return p.slug === v.slug; })) { say('A post with this web address already exists. Change the web address.'); return null; }
      say(''); return v;
    }
    var acts = h('div', 'acts'); box.appendChild(acts);
    acts.appendChild(btn('Preview', 'alt', function () { var v = ready(); if (!v) return; var u = URL.createObjectURL(new Blob([buildHtml(v)], { type: 'text/html' })); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }));
    acts.appendChild(btn('Download page', 'ok', function () {
      var v = ready(); if (!v) return;
      var u = URL.createObjectURL(new Blob([buildHtml(v)], { type: 'text/html' })), a = h('a'); a.href = u; a.download = v.slug + '.html'; D.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000); say('Downloaded ' + v.slug + '.html. Now follow the 3 steps below to publish it.', true);
    }));
    acts.appendChild(btn('Copy page code', 'alt', function () {
      var v = ready(); if (!v) return; var html = buildHtml(v);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(html).then(function () { say('Page code copied.', true); }, function () { say('Could not copy. Use "Download page" instead.'); });
      else say('Copy is not available on this browser. Use "Download page" instead.');
    }));
    acts.appendChild(btn('Clear draft', 'no', function () { if (!window.confirm('Clear this draft?')) return; try { localStorage.removeItem(DK); } catch (e) {} box.textContent = ''; writeView(box); }));

    var pub = h('div', 'card'); box.appendChild(pub);
    pub.appendChild(h('div', 'ref', 'How to publish'));
    ['1. Tap "Download page".', '2. Tap "Open GitHub upload", choose the downloaded file and tap Commit changes.', '3. Within a few minutes your site lists it on the blog page and in the sitemap automatically.'].forEach(function (s) { pub.appendChild(h('div', 'meta', s)); });
    var pa = h('div', 'acts'); pa.appendChild(ext('Open GitHub upload', REPO + '/upload/main/blog')); pub.appendChild(pa);
    if (!state.posts) loadPosts().catch(function () {});   /* lets the address check see existing posts */
  }

  function mount(root) {
    root.textContent = '';
    var c = h('div'), bar = h('div', 'tabs'), body = h('div'); root.appendChild(c); c.appendChild(bar); c.appendChild(body);
    var views = [['posts', 'Written posts', postsView], ['queue', 'Daily writer', queueView], ['write', 'Write a post', writeView]];
    function show(k) {
      bar.textContent = ''; body.textContent = '';
      views.forEach(function (v) { var b = h('button', v[0] === k ? 'on' : '', v[1]); b.type = 'button'; b.onclick = function () { show(v[0]); }; bar.appendChild(b); });
      views.filter(function (v) { return v[0] === k; })[0][2](body);
    }
    show('posts');
  }
  window.STMBlog = { mount: mount };
})();
