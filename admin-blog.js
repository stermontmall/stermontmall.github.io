/* Stermont Arcade · admin: Blogs & SEO.
   Mounted by admin.html through STMBlog.mount(containerEl).
   Four views: (1) published posts with an SEO check and an Edit button, (2) drafts the daily writer opened as pull requests
   (preview, edit, publish or discard in one tap), (3) write or edit a post and publish it straight from here, (4) the daily writer's topic queue.
   Publishing talks to GitHub with a fine-grained token that you paste once; it is kept only in this browser (localStorage) and can be removed with "Disconnect".
   Your existing "Build blog index and sitemap" workflow lists new posts automatically after every publish.
   All text from the site, from GitHub or from forms is set with textContent or escaped before it is placed in a page. */
(function () {
  var D = document, SITE = 'https://stermontarcade.co.ke', RP = 'stermontmall/stermontmall.github.io', REPO = 'https://github.com/' + RP, DK = 'stm_blog_draft', TK = 'stm_gh_token';
  var state = { posts: null, topics: null, edit: null, show: null };

  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function words(s) { return (String(s).match(/\S+/g) || []).length; }
  function slugify(t) { return String(t).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, ''); }
  function inp(tag, attrs) { var i = D.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); }); i.style.cssText = 'width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff'; return i; }
  function ext(text, href) { var a = h('a', 'btn alt sm', text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function btn(text, cls, fn) { var b = h('button', 'btn ' + (cls || 'alt') + ' sm', text); b.type = 'button'; b.onclick = fn; return b; }
  function get(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function dom(t) { return new DOMParser().parseFromString(t, 'text/html'); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function pool(items, n, fn) {
    var i = 0;
    function next() { if (i >= items.length) return Promise.resolve(); return fn(items[i++]).then(next, next); }
    var ws = []; for (var k = 0; k < n; k++) ws.push(next());
    return Promise.all(ws);
  }

  /* ---------- GitHub (token stays in this browser only) ---------- */
  function token() { try { return localStorage.getItem(TK) || ''; } catch (e) { return ''; } }
  function gh(path, o) {
    o = o || {}; var t = token();
    if (!t) return Promise.reject(new Error('Connect GitHub first.'));
    return fetch('https://api.github.com' + path, {
      method: o.method || 'GET',
      headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: o.body ? JSON.stringify(o.body) : undefined
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.text().then(function (x) {
        var j = null; try { j = x ? JSON.parse(x) : null; } catch (e) {}
        if (!r.ok) {
          var m = (j && j.message) || ('GitHub error ' + r.status);
          if (r.status === 401) m = 'GitHub rejected the token. Tap Disconnect and connect again.';
          else if (r.status === 403 || r.status === 404) m += ' (the token needs Contents and Pull requests read and write on this repository)';
          throw new Error(m);
        }
        return j;
      });
    });
  }
  function toB64(s) { var b = new TextEncoder().encode(s), bin = '', i; for (i = 0; i < b.length; i += 8192) bin += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(bin); }
  function fromB64(s) { var bin = atob(String(s).replace(/\s/g, '')), a = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new TextDecoder().decode(a); }
  function getFile(path, ref) { return gh('/repos/' + RP + '/contents/' + path + (ref ? '?ref=' + encodeURIComponent(ref) : '')).then(function (j) { return { sha: j.sha, text: fromB64(j.content) }; }); }
  function putFile(path, text, msg, branch, sha) { var b = { message: msg, content: toB64(text), branch: branch || 'main' }; if (sha) b.sha = sha; return gh('/repos/' + RP + '/contents/' + path, { method: 'PUT', body: b }); }

  /* Shows a "connected" line, or the one-time connect card. Returns true when connected. */
  function ghStatus(box, rerender) {
    var c = h('div', 'card');
    if (token()) {
      c.appendChild(h('div', 'meta', 'GitHub connected ✓ (saved on this device only)'));
      var a = h('div', 'acts'); a.appendChild(btn('Disconnect', 'alt', function () { try { localStorage.removeItem(TK); } catch (e) {} rerender(); })); c.appendChild(a);
      box.appendChild(c); return true;
    }
    c.appendChild(h('div', 'ref', 'Connect GitHub (one time)'));
    ['This lets the admin publish and edit posts for you. Only connect on your own phone or computer.',
      '1. Tap "Create token" below and sign in to GitHub.',
      '2. Name: Stermont admin. Expiration: 90 days or longer. Repository access: Only select repositories → stermontmall.github.io.',
      '3. Under Repository permissions set Contents = Read and write, and Pull requests = Read and write.',
      '4. Tap Generate token, copy it, paste it here and tap Connect.'].forEach(function (s) { c.appendChild(h('div', 'meta', s)); });
    var t = inp('input', { type: 'password', placeholder: 'Paste token (starts with github_pat_)', autocomplete: 'off' }); t.style.marginTop = '.6rem'; c.appendChild(t);
    var m = h('div', 'err'); m.hidden = true; c.appendChild(m);
    var a2 = h('div', 'acts'); c.appendChild(a2);
    a2.appendChild(ext('Create token', 'https://github.com/settings/personal-access-tokens/new'));
    a2.appendChild(btn('Connect', 'ok', function () {
      var v = t.value.trim(); if (v.length < 20) { m.textContent = 'Paste the full token first.'; m.hidden = false; return; }
      try { localStorage.setItem(TK, v); } catch (e) { m.textContent = 'This browser cannot save the token.'; m.hidden = false; return; }
      gh('/repos/' + RP).then(function (r) {
        if (!r.permissions || !r.permissions.push) throw new Error('The token can read the repository but not write to it. Set Contents to Read and write.');
        rerender();
      }).catch(function (e) { try { localStorage.removeItem(TK); } catch (x) {} m.textContent = e.message; m.hidden = false; });
    }));
    box.appendChild(c); return false;
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

  /* ---------- SEO check of a published page ---------- */
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
  function fillPost(p, res) {
    p.ui.badge.textContent = res.pass + '/' + res.total + ' SEO';
    p.ui.badge.className = 'badge ' + (res.fails === 0 ? 'b-paid' : res.fails <= 2 ? 'b-pending' : 'b-declined');
    p.ui.det.textContent = '';
    res.checks.forEach(function (c) { p.ui.det.appendChild(h('div', 'meta', (c.ok ? '✅ ' : '⚠️ ') + c.label + (c.ok ? '' : ' - ' + c.note))); });
    p.ui.det.appendChild(h('div', 'meta', 'Length: ' + res.words + ' words'));
  }
  function note(p, text, ok) { p.ui.msg.textContent = text; p.ui.msg.style.color = ok ? '#15803d' : '#b91c1c'; p.ui.msg.hidden = !text; }

  /* ---------- turning a page into editable text and back ---------- */
  var CSS = '*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}main{max-width:760px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}h1{font-size:1.6rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:1.6rem 0 .4rem}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:1rem 0}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}.meta{color:#6b6b80;font-size:.85rem}footer{max-width:760px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}';
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
  function ld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>'; }
  function buildHtml(v, published) {
    var bl = blocksOf(v.body), wc = words(plain(v.body)), iso = today(), url = SITE + '/blog/' + v.slug + '.html', pub = published || iso;
    var nice = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
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
      ld({ '@context': 'https://schema.org', '@type': 'Article', headline: v.title, datePublished: pub, dateModified: iso, inLanguage: 'en-KE', author: { '@type': 'Organization', name: 'Stermont Arcade' }, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: logo } }, mainEntityOfPage: url, image: logo }) + '\n' +
      ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], ['Buying guides', SITE + '/blog/'], [v.title, url]].map(function (x, i) { return { '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] }; }) }) + '\n' +
      '<script src="/analytics.js" defer></script></head><body>\n' +
      '<header><a href="' + SITE + '/">Stermont Arcade</a></header><main>\n' +
      '<nav class="bc"><a href="' + SITE + '/">Home</a> › <a href="/blog/">Buying guides</a> › ' + t + '</nav>\n' +
      '<h1>' + t + '</h1>\n<p class="meta">Updated ' + nice + ' · ' + Math.max(2, Math.round(wc / 200)) + ' min read</p>\n' + main + '\n' +
      '<a class="btn" href="/products.html">Browse all products</a>\n' +
      '<div class="box"><a href="https://wa.me/254748888230?text=Hello%20Stermont%20Arcade">Questions? Chat with us on WhatsApp</a></div>\n</main>\n' +
      '<footer>Stermont Arcade · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/254748888230">WhatsApp +254 748 888 230</a> · <a href="/shipping.html">Shipping</a> · <a href="/returns.html">Returns</a> · <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>\n';
  }
  /* Reads a published page back into the editor fields. std=false means the page has a custom layout that the editor would flatten. */
  function parsePost(text, slug) {
    var doc = dom(text), main = doc.querySelector('main'), h1 = main && main.querySelector('h1');
    if (!h1) return null;
    var std = true, st = doc.querySelector('style');
    if (!st || st.textContent.trim() !== CSS) std = false;
    if (/"@type"\s*:\s*"(?:FAQPage|HowTo|Product|VideoObject|Review|ItemList)"/.test(text)) std = false;
    function back(el) {
      var out = '';
      Array.prototype.forEach.call(el.childNodes, function (n) {
        if (n.nodeType === 3) out += n.nodeValue;
        else if (n.nodeType === 1 && n.tagName === 'A') {
          var hr = n.getAttribute('href') || '', p = hr.indexOf(SITE) === 0 ? hr.slice(SITE.length) : hr;
          if (/^\/[A-Za-z0-9\-_\/\.]*$/.test(p) && p.indexOf('//') < 0 && !n.children.length && n.textContent.indexOf(']') < 0 && n.textContent.indexOf('|') < 0) out += '[[' + p + '|' + n.textContent + ']]';
          else { std = false; out += n.textContent; }
        } else { std = false; out += n.textContent || ''; }
      });
      return out.replace(/\s+/g, ' ').trim();
    }
    var body = [];
    Array.prototype.forEach.call(main.children, function (el) {
      var tg = el.tagName.toLowerCase();
      if (tg === 'nav' || tg === 'h1') return;
      if (tg === 'p' && el.classList.contains('meta')) return;
      if (tg === 'a' && el.classList.contains('btn')) return;
      if (tg === 'div' && el.classList.contains('box')) return;
      if (tg === 'h2') { body.push('## ' + el.textContent.replace(/\s+/g, ' ').trim()); return; }
      if (tg === 'p') { body.push(back(el)); return; }
      if (tg === 'ul') { body.push(Array.prototype.map.call(el.children, function (li) { return '- ' + back(li); }).join('\n')); return; }
      std = false;
    });
    var dm = doc.querySelector('meta[name="description"]'), pm = text.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
    return { title: h1.textContent.replace(/\s+/g, ' ').trim(), slug: slug, desc: dm ? (dm.getAttribute('content') || '') : '', keys: '', body: body.join('\n\n'), published: pm ? pm[1] : '', std: std };
  }

  /* ---------- view 1: published posts ---------- */
  function postCard(p, auto) {
    var k = h('div', 'card'), top = h('div', 'top');
    top.appendChild(h('span', 'ref', p.title));
    var badge = h('span', 'badge b-pending', 'Checking…'); top.appendChild(badge); k.appendChild(top);
    k.appendChild(h('div', 'meta', '/blog/' + p.slug + '.html' + (auto ? ' · written by the daily writer' : '')));
    var det = h('div'); det.hidden = true; k.appendChild(det);
    var msg = h('div', 'meta'); msg.hidden = true; k.appendChild(msg);
    p.ui = { badge: badge, det: det, msg: msg };
    var a = h('div', 'acts');
    a.appendChild(btn('SEO details', 'alt', function () { det.hidden = !det.hidden; }));
    a.appendChild(btn('Edit', 'alt', function () {
      note(p, 'Opening…', true);
      get('blog/' + p.slug + '.html').then(function (t) {
        var pp = parsePost(t, p.slug);
        if (!pp) throw new Error('Could not read this page.');
        if (!pp.std) { note(p, 'This post has a custom layout, so editing it here could remove parts of it. Edit it on GitHub instead.', false); msg.appendChild(D.createTextNode(' ')); var l = ext('Open on GitHub', REPO + '/edit/main/blog/' + p.slug + '.html'); msg.appendChild(l); return; }
        state.edit = { slug: p.slug, ref: 'main', published: pp.published, data: pp }; state.show('write');
      }).catch(function (e) { note(p, e.message, false); });
    }));
    a.appendChild(ext('View post', '/blog/' + p.slug + '.html'));
    k.appendChild(a); return k;
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

  /* ---------- view 2: drafts from the daily writer (open pull requests) ---------- */
  function draftCard(pr, list) {
    var slug = pr.head.ref.replace(/^draft\//, ''), path = 'blog/' + slug + '.html', ref = pr.head.ref, file = null;
    var title = String(pr.title || slug).replace(/^Blog draft:\s*/i, '');
    var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', title));
    var badge = h('span', 'badge b-pending', 'Checking…'); top.appendChild(badge); k.appendChild(top);
    k.appendChild(h('div', 'meta', 'Written by the daily writer · /blog/' + slug + '.html · not live yet'));
    var det = h('div'); det.hidden = true; k.appendChild(det);
    var msg = h('div', 'meta'); msg.hidden = true; k.appendChild(msg);
    var p = { ui: { badge: badge, det: det, msg: msg } };
    function load() { return file ? Promise.resolve(file) : getFile(path, ref).then(function (f) { file = f; return f; }); }
    load().then(function (f) { fillPost(p, checkPost(dom(f.text))); }, function () { badge.textContent = 'Could not check'; badge.className = 'badge b-declined'; });
    var a = h('div', 'acts');
    a.appendChild(btn('SEO details', 'alt', function () { det.hidden = !det.hidden; }));
    a.appendChild(btn('Preview', 'alt', function () { load().then(function (f) { var u = URL.createObjectURL(new Blob([f.text], { type: 'text/html' })); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }).catch(function (e) { note(p, e.message, false); }); }));
    a.appendChild(btn('Edit', 'alt', function () {
      load().then(function (f) {
        var pp = parsePost(f.text, slug);
        if (!pp) throw new Error('Could not read this draft.');
        if (!pp.std) { note(p, 'This draft has a layout the editor cannot safely change. Open the pull request on GitHub to edit it.', false); return; }
        state.edit = { slug: slug, ref: ref, pr: pr.number, published: pp.published, data: pp }; state.show('write');
      }).catch(function (e) { note(p, e.message, false); });
    }));
    a.appendChild(btn('Publish ✅', 'ok', function () {
      if (!window.confirm('Publish "' + title + '" on your website now?')) return;
      note(p, 'Publishing…', true);
      gh('/repos/' + RP + '/pulls/' + pr.number + '/merge', { method: 'PUT', body: { merge_method: 'merge', commit_title: 'Publish blog post: ' + title } }).then(function () {
        state.posts = null; k.textContent = ''; k.appendChild(h('div', 'ref', title)); k.appendChild(h('div', 'meta', '✅ Published. It goes live in a minute or two and is added to the blog list and sitemap automatically.'));
      }).catch(function (e) { note(p, e.message, false); });
    }));
    a.appendChild(btn('Discard', 'no', function () {
      if (!window.confirm('Discard this draft? It will not be published.')) return;
      gh('/repos/' + RP + '/pulls/' + pr.number, { method: 'PATCH', body: { state: 'closed' } }).then(function () {
        return gh('/repos/' + RP + '/git/refs/heads/' + ref, { method: 'DELETE' }).catch(function () {});
      }).then(function () {
        k.textContent = ''; k.appendChild(h('div', 'ref', title)); k.appendChild(h('div', 'meta', 'Discarded. The topic stays in the queue, so the daily writer may draft it again. Remove it from the topic list if you do not want that.'));
      }).catch(function (e) { note(p, e.message, false); });
    }));
    k.appendChild(a); return k;
  }
  function draftsView(box) {
    if (!ghStatus(box, function () { box.textContent = ''; draftsView(box); })) return;
    var list = h('div'); box.appendChild(list); list.appendChild(h('div', 'meta', 'Loading drafts…'));
    gh('/repos/' + RP + '/pulls?state=open&per_page=50').then(function (prs) {
      prs = prs.filter(function (p) { return p.head && /^draft\//.test(p.head.ref); });
      list.textContent = '';
      if (!prs.length) { list.appendChild(h('div', 'empty', 'No drafts waiting. The daily writer adds one at 09:00 Nairobi time.')); return; }
      list.appendChild(h('div', 'meta', 'Nothing here is live until you tap Publish. Read it, edit it if needed, then publish or discard.'));
      prs.forEach(function (pr) { list.appendChild(draftCard(pr, list)); });
    }).catch(function (e) { list.textContent = ''; list.appendChild(h('div', 'err', e.message)); });
  }

  /* ---------- view 3: write or edit a post ---------- */
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
  function loadDraft() { try { return JSON.parse(localStorage.getItem(DK)) || {}; } catch (e) { return {}; } }
  function saveDraft(v) { try { localStorage.setItem(DK, JSON.stringify(v)); } catch (e) {} }

  function writeView(box, startMsg) {
    var ed = state.edit, d = ed ? ed.data : loadDraft(), slugTouched = !!d.slug;
    if (ed) {
      var bn = h('div', 'card');
      bn.appendChild(h('div', 'ref', ed.pr ? 'Editing a daily-writer draft' : 'Editing a published post'));
      bn.appendChild(h('div', 'meta', '/blog/' + ed.slug + '.html' + (ed.pr ? ' · saving updates the draft, then publish it from "Drafts"' : ' · saving updates the live page')));
      var ba = h('div', 'acts'); ba.appendChild(btn('Cancel editing', 'alt', function () { state.edit = null; state.show(ed.pr ? 'drafts' : 'posts'); })); bn.appendChild(ba); box.appendChild(bn);
    }
    var card = h('div', 'card xform'); box.appendChild(card);
    card.appendChild(h('div', 'meta full', ed ? 'Change anything below, check the SEO list, then save.' : 'Write a post in your own words. The checklist shows how well it is set up for Google. Your draft saves automatically on this phone.'));
    var title = inp('input', { type: 'text', maxlength: '70', placeholder: 'e.g. How to choose a fridge for a Kenyan home' });
    var slug = inp('input', { type: 'text', maxlength: '70', placeholder: 'created from the headline' });
    var desc = inp('textarea', { rows: '3', maxlength: '200', placeholder: 'One or two sentences shown under your link on Google' });
    var keys = inp('input', { type: 'text', maxlength: '120', placeholder: 'main keyword first, e.g. fridge price in Kenya' });
    var body = inp('textarea', { rows: '16', placeholder: 'Write in plain paragraphs with a blank line between them.\n\n## Type two # and a space for a section heading\n\n- Start a line with a dash for a bullet\n\nLink to your shop like this: [[/products.html|browse all products]]' });
    title.value = d.title || ''; slug.value = ed ? ed.slug : (d.slug || ''); desc.value = d.desc || ''; keys.value = d.keys || ''; body.value = d.body || '';
    if (ed) slug.disabled = true;
    function fld(label, input, extra) { var w = h('div'); w.appendChild(h('label', null, label)); w.appendChild(input); if (extra) w.appendChild(extra); return w; }
    var tc = h('div', 'meta'), dc = h('div', 'meta'), sc = h('div', 'meta');
    card.appendChild(fld('Headline', title, tc)); card.appendChild(fld('Web address', slug, sc));
    var wd = fld('Search description', desc, dc); wd.className = 'full'; card.appendChild(wd);
    var wk = fld('Keywords (optional, main one first, only used for the checklist)', keys); wk.className = 'full'; card.appendChild(wk);
    var wb = fld('Article', body); wb.className = 'full'; card.appendChild(wb);

    var chk = h('div', 'card'); box.appendChild(chk);
    var msg = h('div', 'err'); msg.hidden = true; box.appendChild(msg);
    function say(t, ok) { msg.textContent = t; msg.style.color = ok ? '#15803d' : ''; msg.style.background = ok ? '#dcfce7' : ''; msg.hidden = !t; }
    function read() { return { title: title.value.trim(), slug: slug.value.trim(), desc: desc.value.trim(), keys: keys.value.trim(), body: body.value }; }
    function update() {
      var v = read(); if (ed) ed.data = Object.assign({}, ed.data, v); else saveDraft(v);
      tc.textContent = v.title.length + ' / 70 characters'; dc.textContent = v.desc.length + ' / 160 characters'; sc.textContent = SITE.replace('https://', '') + '/blog/' + (v.slug || '…') + '.html';
      var r = checkDraft(v); chk.textContent = '';
      var t = h('div', 'tot'); t.appendChild(h('span', null, 'SEO checklist')); t.appendChild(h('span', null, r.pass + ' / ' + r.total)); chk.appendChild(t);
      r.checks.forEach(function (c) { chk.appendChild(h('div', 'meta', (c.ok ? '✅ ' : '⬜ ') + c.label + (c.ok ? '' : ' (' + c.note + ')'))); });
    }
    title.addEventListener('input', function () { if (!slugTouched && !ed) slug.value = slugify(title.value); update(); });
    slug.addEventListener('input', function () { slugTouched = true; update(); });
    [desc, keys, body].forEach(function (e) { e.addEventListener('input', update); });
    update();
    if (startMsg) say(startMsg, true);

    function ready() {
      var v = read();
      if (v.title.length < 10) { say('Add a headline first.'); return null; }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) || v.slug.length < 3) { say('The web address can only use small letters, numbers and dashes.'); return null; }
      if (v.desc.length < 40) { say('Add a search description (at least one sentence).'); return null; }
      if (words(v.body) < 150) { say('The article is too short. Write at least 150 words (500 or more ranks better).'); return null; }
      if (!ed && state.posts && state.posts.some(function (p) { return p.slug === v.slug; })) { say('A post with this web address already exists. Change the web address.'); return null; }
      say(''); return v;
    }
    var acts = h('div', 'acts'); box.appendChild(acts);
    acts.appendChild(btn('Preview', 'alt', function () { var v = ready(); if (!v) return; var u = URL.createObjectURL(new Blob([buildHtml(v, ed && ed.published)], { type: 'text/html' })); window.open(u, '_blank'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }));
    var go = btn(ed ? 'Save changes' : 'Publish now ✅', 'ok', function () {
      var v = ready(); if (!v) return;
      if (!token()) { say('Connect GitHub first (the card below), then tap this button again.'); return; }
      var path = 'blog/' + v.slug + '.html', html = buildHtml(v, ed && ed.published), ref = ed ? ed.ref : 'main', url = SITE + '/blog/' + v.slug + '.html';
      go.disabled = true; say('Saving…', true);
      var job = ed ? getFile(path, ref).then(function (f) { return putFile(path, html, 'Edit blog post: ' + v.title, ref, f.sha); }) : putFile(path, html, 'Add blog post: ' + v.title, 'main');
      job.then(function () {
        state.posts = null;
        if (ed) say(ed.pr ? 'Saved to the draft. Go to "Drafts" and tap Publish when you are ready.' : 'Saved ✅ The live page updates in a minute or two.', true);
        else {
          try { localStorage.removeItem(DK); } catch (e) {}
          state.edit = { slug: v.slug, ref: 'main', published: today(), data: v };
          box.textContent = ''; writeView(box, 'Published ✅ It goes live at ' + url + ' in a minute or two and is added to the blog list and sitemap automatically.');
        }
      }).catch(function (e) { say(/sha|already exists|422/i.test(e.message) && !ed ? 'A post with this web address already exists. Change the web address.' : e.message); }).then(function () { go.disabled = false; });
    });
    acts.appendChild(go);
    acts.appendChild(btn('Download page', 'alt', function () {
      var v = ready(); if (!v) return;
      var u = URL.createObjectURL(new Blob([buildHtml(v, ed && ed.published)], { type: 'text/html' })), a = h('a'); a.href = u; a.download = v.slug + '.html'; D.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000); say('Downloaded ' + v.slug + '.html (a backup copy).', true);
    }));
    if (!ed) acts.appendChild(btn('Clear draft', 'no', function () { if (!window.confirm('Clear this draft?')) return; try { localStorage.removeItem(DK); } catch (e) {} box.textContent = ''; writeView(box); }));
    ghStatus(box, function () { var v = ed ? ed.data : null; box.textContent = ''; writeView(box); });
    if (!state.posts) loadPosts().catch(function () {});   /* lets the address check see existing posts */
  }

  /* ---------- view 4: daily writer queue ---------- */
  function queueView(box) {
    box.appendChild(h('div', 'meta', 'Loading…'));
    loadTopics().then(function (ts) {
      box.textContent = '';
      var by = {}; ts.forEach(function (t) { by[t.status] = (by[t.status] || 0) + 1; });
      var c = h('div', 'card');
      c.appendChild(h('div', 'meta', 'The daily writer drafts one post a day at 09:00 Nairobi time from the next pending topic. The draft waits in "Drafts" so you can read, edit and publish it. Nothing goes live until you publish.'));
      var tot = h('div', 'tot'); tot.appendChild(h('span', null, 'Pending topics')); tot.appendChild(h('span', null, String(by.pending || 0))); c.appendChild(tot);
      c.appendChild(h('div', 'meta', 'Already drafted: ' + (by.drafted || 0) + ' · Paused: ' + (by.paused || 0)));
      if ((by.pending || 0) < 8) c.appendChild(h('div', 'meta', '⚠️ The queue is running low. Add more topics so the daily writer does not stop.'));
      var a = h('div', 'acts');
      a.appendChild(btn('Open drafts', 'ok', function () { state.show('drafts'); }));
      a.appendChild(ext('Add or edit topics', REPO + '/edit/main/blog-topics.json')); a.appendChild(ext('Run the writer now', REPO + '/actions/workflows/blog-writer.yml'));
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

  function mount(root) {
    root.textContent = '';
    var c = h('div'), bar = h('div', 'tabs'), body = h('div'); root.appendChild(c); c.appendChild(bar); c.appendChild(body);
    var views = [['posts', 'Published posts', postsView], ['drafts', 'Drafts to review', draftsView], ['write', state.edit ? 'Edit post' : 'Write a post', writeView], ['queue', 'Daily writer', queueView]];
    function show(k) {
      if (k !== 'write' && state.edit && k !== 'drafts' && k !== 'posts') state.edit = null;
      views[2][1] = state.edit ? 'Edit post' : 'Write a post';
      bar.textContent = ''; body.textContent = '';
      views.forEach(function (v) { var b = h('button', v[0] === k ? 'on' : '', v[1]); b.type = 'button'; b.onclick = function () { if (v[0] === 'write' && k !== 'write' && state.edit && !state.edit.keep) { /* keep editing session */ } show(v[0]); }; bar.appendChild(b); });
      views.filter(function (v) { return v[0] === k; })[0][2](body);
    }
    state.show = show;
    show(state.edit ? 'write' : 'posts');
  }
  window.STMBlog = { mount: mount };
})();
