// Stermont Arcade - publishes admin-APPROVED SEO proposals to the site files, automatically.
//
// What an approval publishes: ONLY the proposal's SEO title and meta description. The proposal's
// markdown body is an editorial brief (rule-based checklist + a copy of the existing page), never page copy,
// so it is never written to a page.
//
// Safety rules (a proposal that breaks any of them is NOT published; it becomes status "failed" with the reason in
// publish_error, which the admin SEO Doctor shows):
//   - only hand-edited pages are touched: blog posts and public root pages. Generated pages (p/, c/, guides/, services/)
//     are overwritten by their generators, so they are refused ("edit the generator", CLAUDE.md rule 3).
//   - title 25-70 characters (the blog title normaliser caps at 70), no ellipsis, not cut off mid-word, not ending on
//     a dangling word ("and", "for", "in" ...), no double spaces.
//   - description 110-160 characters, no ellipsis, none of the generic boilerplate the free audit falls back to.
//   - title and description must stay unique across the site (same rule as seo-check.mjs).
//   - proposals from the automatic audits (anything except admin-authored text) may not swap a valid, more specific
//     live title or description for a shorter one.
//   - afterwards the whole-site audit (seo-check.mjs) may not report more problems than before; otherwise everything is reverted.
//
// Modes (Node 18+, no installs):
//   node seo-publish.mjs plan [--from-file proposals.json]   read approved proposals, edit files, write seo-publish-result.json
//   node seo-publish.mjs gate before.md after.md              exit 3 if the audit got worse (and mark changed rows failed)
//   node seo-publish.mjs verify                              poll the live site until the edited pages, titles and sitemap dates are live (exit 4 if not)
//   node seo-publish.mjs finalize [--dry-run]                 write published/failed back to Supabase
// Env for plan/finalize against the database: SUPABASE_URL, SUPABASE_SERVICE_KEY.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SITE = 'https://stermontarcade.co.ke';
export const BRAND = ' | Stermont Arcade';
export const LIMITS = { titleMin: 25, titleMax: 70, descMin: 110, descMax: 160, liveDescMin: 70, liveDescMax: 165 };
export const RESULT_FILE = 'seo-publish-result.json';
// Text written by an admin is trusted for wording; every automatic audit is held to the stricter "no regression" rule.
export const TRUSTED_MODELS = new Set(['research-assisted-manual-v1', 'admin-authored']);
const GENERIC_DESC = [/explore the details, check what applies to your location/i, /request a clear quotation from stermont arcade/i];
const DANGLING = /\b(and|or|the|a|an|of|for|to|in|on|at|with|by|from|your|our|what|which|how|is|are|that|as|but|into|about|than)$/i;
const NOT_PAGES = /^(admin|account|upload-photos|builder|google|404|cart|checkout)/;

export const decode = s => String(s ?? '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const encText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encAttr = s => encText(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const squash = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const stem = t => String(t).endsWith(BRAND) ? String(t).slice(0, -BRAND.length) : String(t);
const trimEllipsis = t => stem(t).replace(/(…|\.{3})+\s*$/, '').trim().toLowerCase();

// ---------- which file does a proposal point at, and may we edit it? ----------
export function resolveTarget(targetUrl, exists = existsSync) {
  let u;
  try { u = new URL(targetUrl); } catch { return { ok: false, reason: 'The proposal has no valid page URL.' }; }
  if (u.origin !== SITE) return { ok: false, reason: `The page is not on ${SITE}.` };
  let path = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  if (!/^[a-z0-9][a-z0-9/_-]*\.html$/i.test(path) || path.includes('..')) return { ok: false, reason: 'Only plain .html pages can be published.' };
  const top = path.split('/')[0];
  const generated = ['p', 'c', 'guides', 'services'].includes(top) || path === 'blog/index.html';
  const inBlog = path.startsWith('blog/') && path.split('/').length === 2 && path !== 'blog/index.html';
  const isRoot = !path.includes('/') && !NOT_PAGES.test(path);
  if (!generated && !inBlog && !isRoot) return { ok: false, reason: `${path} is not a hand-edited public page.` };
  if (!exists(path)) return { ok: false, reason: `${path} does not exist in the repository.` };
  const loc = `${SITE}/${path}`;
  if (generated) return { ok: true, editable: false, file: path, kind: 'generated', loc, reason: `${path} is a generated page; its generator rewrites it, so change the generator or seo-overrides.json instead of publishing here.` };
  return { ok: true, editable: true, file: path, kind: inBlog ? 'blog' : 'static', loc };
}

// ---------- read the current head of a page ----------
const metaRe = (attr, val) => new RegExp(`(<meta\\s+${attr}=(["'])${val}\\2\\s+content=)(["'])([\\s\\S]*?)\\3`, 'i');
export function readHead(html) {
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  const d = html.match(metaRe('name', 'description'));
  const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return {
    title: t ? squash(decode(t[1])) : '',
    desc: d ? squash(decode(d[4])) : '',
    h1: h ? squash(decode(h[1].replace(/<[^>]+>/g, ' '))) : '',
    noindex: /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html),
    redirect: /http-equiv=["']refresh["']/i.test(html)
  };
}

// ---------- validation ----------
export function titleProblems(title, live) {
  const out = [], t = squash(title), s = stem(t);
  if (!t) return ['The title is empty.'];
  if (t.length < LIMITS.titleMin) out.push(`Title is ${t.length} characters (minimum ${LIMITS.titleMin}).`);
  if (t.length > LIMITS.titleMax) out.push(`Title is ${t.length} characters (maximum ${LIMITS.titleMax}).`);
  if (/…|\.{3}/.test(t)) out.push('Title contains an ellipsis, so it is a cut-off title.');
  if (/\s{2,}/.test(String(title).trim())) out.push('Title has a double space, which means text was cut out of it.');
  if (DANGLING.test(s.trim())) out.push(`Title stops on the word "${s.trim().split(/\s+/).pop()}", so it reads as cut off.`);
  for (const ref of [live?.h1, live?.title && stem(live.title)]) {
    const r = squash(ref).replace(/(…|\.{3})+$/, '').trim();
    if (r && r.length > s.trim().length && r.toLowerCase().startsWith(s.trim().toLowerCase()) && /\w$/.test(s.trim()) && /\w/.test(r[s.trim().length] || ' ')) {
      out.push('Title is cut off in the middle of a word.'); break;
    }
  }
  return out;
}
export function descProblems(desc) {
  const out = [], d = squash(desc);
  if (!d) return ['The meta description is empty.'];
  if (d.length < LIMITS.descMin) out.push(`Description is ${d.length} characters (minimum ${LIMITS.descMin}).`);
  if (d.length > LIMITS.descMax) out.push(`Description is ${d.length} characters (maximum ${LIMITS.descMax}).`);
  if (/…|\.{3}/.test(d)) out.push('Description contains an ellipsis, so it is cut off.');
  if (GENERIC_DESC.some(r => r.test(d))) out.push('Description is the generic fallback sentence ("Explore the details... request a clear quotation"), not text written for this page.');
  return out;
}
const liveTitleValid = t => !!t && titleProblems(t, null).length === 0;
const liveDescValid = d => !!d && d.length >= LIMITS.liveDescMin && d.length <= LIMITS.liveDescMax && !/…|\.{3}/.test(d) && !GENERIC_DESC.some(r => r.test(d));

// ---------- apply the change to the HTML (keeps each tag's own quote style) ----------
const setMeta = (html, attr, val, text) => html.replace(metaRe(attr, val), (_, p1, _q1, q2) => `${p1}${q2}${encAttr(text)}${q2}`);
export function applyToHtml(html, { title, desc, today, bumpModified }) {
  let h = html;
  if (title != null) {
    h = h.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${encText(title)}</title>`);
    h = setMeta(h, 'property', 'og:title', title);
    h = setMeta(h, 'name', 'twitter:title', title);
  }
  if (desc != null) {
    h = setMeta(h, 'name', 'description', desc);
    h = setMeta(h, 'property', 'og:description', desc);
    h = setMeta(h, 'name', 'twitter:description', desc);
  }
  if (bumpModified && h !== html) h = h.replace(/("dateModified":")\d{4}-\d{2}-\d{2}/, `$1${today}`);
  return h;
}
export function bumpSitemap(xml, loc, today) {
  const re = new RegExp(`(<url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
  return re.test(xml) ? xml.replace(re, (_, a, b) => a + today + b) : xml;
}

// ---------- site-wide uniqueness index (same page set as seo-check.mjs) ----------
function listHtml(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? listHtml(`${dir}/${x.name}`) : (x.name.endsWith('.html') ? [`${dir}/${x.name}`] : []));
}
export function buildIndex(read = f => readFileSync(f, 'utf8')) {
  const roots = readdirSync('.').filter(f => f.endsWith('.html') && !NOT_PAGES.test(f));
  const pages = [...new Set([...roots, ...['p', 'c', 'blog', 'services', 'guides'].flatMap(listHtml)])];
  const titles = new Map(), descs = new Map();
  for (const f of pages) {
    const hd = readHead(read(f));
    if (hd.noindex || hd.redirect) continue;
    for (const [m, v] of [[titles, hd.title], [descs, hd.desc]]) if (v) { const k = v.toLowerCase(); (m.get(k) || m.set(k, new Set()).get(k)).add(f); }
  }
  return { titles, descs };
}
const takenByOther = (map, value, file) => { const s = map.get(String(value).toLowerCase()); return !!s && [...s].some(f => f !== file); };
const moveIndex = (map, oldV, newV, file) => {
  if (oldV) map.get(oldV.toLowerCase())?.delete(file);
  if (newV) { const k = newV.toLowerCase(); (map.get(k) || map.set(k, new Set()).get(k)).add(file); }
};

// ---------- decide + apply one proposal ----------
export function processProposal(p, ctx) {
  const base = { id: p.id, url: p.target_url, model: p.generation_model || null };
  const fail = reasons => ({ ...base, status: 'failed', changed: false, reasons: [].concat(reasons) });
  const target = resolveTarget(p.target_url, ctx.exists);
  if (!target.ok) return fail(target.reason);
  const html = ctx.read(target.file), live = readHead(html);
  if (live.noindex) return fail('The page is set to noindex, so there is nothing to publish for search.');
  if (live.redirect) return fail('The page is a redirect page.');
  if (!live.title) return fail('The live page has no <title> to replace.');
  if (!live.desc) return fail('The live page has no meta description tag to replace.');
  const rawTitle = decode(p.title), wantTitle = squash(rawTitle), wantDesc = squash(decode(p.meta_description));
  // A cut-off "…" in the live title counts as the same title; a proposal that only removes it changes nothing.
  const titleSame = wantTitle === live.title || (wantTitle && trimEllipsis(wantTitle) === trimEllipsis(live.title));
  const descSame = wantDesc === live.desc;
  if (titleSame && descSame) return { ...base, status: 'published', changed: false, file: target.file, reasons: [], note: 'Already live; the page already has this title and description.' };

  if (!target.editable) return fail(target.reason);
  const reasons = [];
  const trusted = TRUSTED_MODELS.has(p.generation_model);
  if (!titleSame) {
    reasons.push(...titleProblems(rawTitle, live));
    if (!trusted && liveTitleValid(live.title) && wantTitle.length < live.title.length) reasons.push('An automatic audit would replace a valid, more specific live title with a shorter one.');
    if (takenByOther(ctx.index.titles, wantTitle, target.file)) reasons.push('Another page already uses this exact title.');
  }
  if (!descSame) {
    reasons.push(...descProblems(wantDesc));
    if (!trusted && liveDescValid(live.desc) && wantDesc.length < live.desc.length) reasons.push('An automatic audit would replace a valid live description with a shorter one.');
    if (takenByOther(ctx.index.descs, wantDesc, target.file)) reasons.push('Another page already uses this exact description.');
  }
  if (reasons.length) return fail([...new Set(reasons)]);

  const next = applyToHtml(html, { title: titleSame ? null : wantTitle, desc: descSame ? null : wantDesc, today: ctx.today, bumpModified: target.kind === 'blog' });
  if (next === html) return fail('The page markup has no matching title/description tags to change.');
  const after = readHead(next);
  if ((!titleSame && after.title !== wantTitle) || (!descSame && after.desc !== wantDesc)) return fail('The edit did not produce the expected title/description, so it was not saved.');
  ctx.write(target.file, next);
  if (!titleSame) moveIndex(ctx.index.titles, live.title, wantTitle, target.file);
  if (!descSame) moveIndex(ctx.index.descs, live.desc, wantDesc, target.file);
  return { ...base, status: 'published', changed: true, file: target.file, kind: target.kind, loc: target.loc, wantTitle: titleSame ? null : wantTitle, wantDesc: descSame ? null : wantDesc, reasons: [] };
}

export function planAll(proposals, ctx) {
  return proposals.map(p => processProposal(p, ctx));
}


// ---------- verify what is live (articles, sitemap date, title/description) ----------
export async function verifyLive(data, { fetchText, sleep = ms => new Promise(r => setTimeout(r, ms)), attempts = 14, waitMs = 30000, log = console.log } = {}) {
  const today = String(data.at || '').slice(0, 10);
  const todo = data.results.filter(r => r.changed && r.loc);
  const problems = {};
  for (let i = 1; i <= attempts && todo.length; i++) {
    let sitemap = '';
    try { sitemap = await fetchText(`${SITE}/sitemap.xml?v=${Date.now()}`); } catch { /* retried below */ }
    for (const r of todo.slice()) {
      const issues = [];
      try {
        const live = readHead(await fetchText(`${r.loc}?v=${Date.now()}`));
        if (r.wantTitle != null && live.title !== r.wantTitle) issues.push(`title is "${live.title}"`);
        if (r.wantDesc != null && live.desc !== r.wantDesc) issues.push('meta description is not the approved text yet');
      } catch (e) { issues.push(`page not reachable (${e.message})`); }
      const block = sitemap.match(new RegExp(`<loc>${r.loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>([^<]*)</lastmod>`));
      if (!block) issues.push('page is missing from sitemap.xml'); else if (block[1] < today) issues.push(`sitemap lastmod is ${block[1]}, expected ${today}`);
      if (issues.length) problems[r.loc] = issues; else { delete problems[r.loc]; todo.splice(todo.indexOf(r), 1); log(`LIVE OK  ${r.loc} (title, description and sitemap date)`); }
    }
    if (todo.length && i < attempts) { log(`Waiting for GitHub Pages (${todo.length} page(s) not updated yet, attempt ${i}/${attempts})...`); await sleep(waitMs); }
  }
  for (const r of todo) log(`NOT LIVE ${r.loc}: ${(problems[r.loc] || []).join('; ')}`);
  return { ok: todo.length === 0, pending: todo.map(r => ({ loc: r.loc, issues: problems[r.loc] || [] })) };
}

// ---------- Supabase (service key, REST only) ----------
const env = n => process.env[n] || '';
async function db(path, init = {}) {
  const url = env('SUPABASE_URL').replace(/\/+$/, ''), key = env('SUPABASE_SERVICE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
  const r = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
export const fetchApproved = () => db('seo_content_proposals?status=eq.approved&select=id,target_type,target_slug,target_url,title,meta_description,generation_model,reviewed_at&order=reviewed_at.asc&limit=200');
async function mark(id, body) {
  const rows = await db(`seo_content_proposals?id=eq.${encodeURIComponent(id)}&status=eq.approved`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) });
  return Array.isArray(rows) && rows.length === 1;
}

// ---------- CLI ----------
function totalOf(report) { const m = String(report).match(/Found \*\*(\d+)\*\*/); return m ? +m[1] : 0; }
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const today = new Date().toISOString().slice(0, 10);
  if (cmd === 'plan') {
    const fi = args.indexOf('--from-file');
    const proposals = fi >= 0 ? JSON.parse(readFileSync(args[fi + 1], 'utf8')) : await fetchApproved();
    console.log(`Approved proposals waiting: ${proposals.length}`);
    const ctx = { exists: existsSync, read: f => readFileSync(f, 'utf8'), write: (f, c) => writeFileSync(f, c), index: buildIndex(), today };
    const results = planAll(proposals, ctx);
    const changed = results.filter(r => r.changed);
    // Static root pages have no generator that moves their sitemap date, so move it here. Blog dates follow dateModified in blog-build.mjs.
    if (changed.some(r => r.kind === 'static') && existsSync('sitemap.xml')) {
      let xml = readFileSync('sitemap.xml', 'utf8');
      for (const r of changed.filter(x => x.kind === 'static')) xml = bumpSitemap(xml, r.loc, today);
      writeFileSync('sitemap.xml', xml);
    }
    writeFileSync(RESULT_FILE, JSON.stringify({ at: new Date().toISOString(), results }, null, 1));
    for (const r of results) console.log(`${r.status.toUpperCase().padEnd(9)} ${r.changed ? 'EDITED ' : r.status === 'published' ? 'NO-OP  ' : '       '} ${r.file || r.url}${r.reasons.length ? '\n          - ' + r.reasons.join('\n          - ') : ''}`);
    console.log(`Summary: ${changed.length} page(s) edited, ${results.filter(r => r.status === 'published' && !r.changed).length} already live, ${results.filter(r => r.status === 'failed').length} refused.`);
    if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed.length}\nwaiting=${proposals.length}\n`, { flag: 'a' });
  } else if (cmd === 'gate') {
    const [beforeFile, afterFile] = args, b = totalOf(readFileSync(beforeFile, 'utf8')), a = totalOf(readFileSync(afterFile, 'utf8'));
    console.log(`Site audit findings: before ${b}, after ${a}.`);
    if (a > b) {
      const data = JSON.parse(readFileSync(RESULT_FILE, 'utf8'));
      for (const r of data.results) if (r.changed) { r.status = 'failed'; r.changed = false; r.reasons = [`The site audit reported ${a - b} new problem(s) after this change, so it was reverted.`]; }
      writeFileSync(RESULT_FILE, JSON.stringify(data, null, 1));
      process.exit(3);
    }
  } else if (cmd === 'verify') {
    const data = JSON.parse(readFileSync(RESULT_FILE, 'utf8'));
    const res = await verifyLive(data, { fetchText: async u => { const r = await fetch(u, { headers: { 'Cache-Control': 'no-cache' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); } });
    if (!res.ok) process.exit(4);
  } else if (cmd === 'finalize') {
    const dry = args.includes('--dry-run'), data = JSON.parse(readFileSync(RESULT_FILE, 'utf8'));
    let ok = 0, lost = 0;
    for (const r of data.results) {
      const body = r.status === 'published' ? { status: 'published', published_at: new Date().toISOString(), publish_error: null } : { status: 'failed', publish_error: r.reasons.join(' ').slice(0, 900) };
      if (dry) { console.log(`[dry run] ${r.id} -> ${body.status}`); continue; }
      (await mark(r.id, body)) ? ok++ : lost++;
    }
    console.log(`Saved ${ok} status update(s)${lost ? `; ${lost} row(s) were no longer in the approved state and were left alone` : ''}.`);
  } else {
    console.error('Usage: node seo-publish.mjs plan [--from-file f.json] | gate before.md after.md | finalize [--dry-run]');
    process.exit(2);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message || e); process.exit(1); });
