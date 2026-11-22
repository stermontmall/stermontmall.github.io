// Read-only audit of every product/category image URL the generated site references.
// Harvests URLs from files in the checkout (no Supabase REST needed), classifies them, and probes each ONCE:
//  - ImageKit web proxy of the Supabase URL  (does /supabase return 200 + image bytes?)
//  - ImageKit native copy at /<bucket>/<path> (was the #1023 copy ever run for this file?)
//  - Supabase original: only SUPABASE_SAMPLE URLs, once each, never retried (it is HTTP 402 while egress is restricted)
//  - GitHub Pages / third-party hosts: one GET each
// Writes image-audit.json and a markdown summary. Never changes anything.
import { readdirSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const IK = 'https://ik.imagekit.io/w6hxfnwmw';
const SB_RE = /https:\/\/oewvtbnmyombbtggamor\.supabase\.co\/storage\/v1\/object\/public\/([^\/"'<>\s\\?#]+)\/([^"'<>\s\\?#]+)/g;
const ANY_RE = /https?:\/\/[^"'<>\s\\)]+\.(?:jpe?g|png|webp|avif|gif)(?:\?[^"'<>\s\\)]*)?/gi;
const SAMPLE = Number(process.env.SUPABASE_SAMPLE || 3);
const CONC = 8;
const roots = ['p', 'c', 'guides', 'services', 'pest-control', 'blog'];
const files = ['index.html', 'sitemap-images.xml', 'merchant-feed.xml', 'mobile-shell/app.js', 'imagekit-url.js'];
for (const r of roots) { try { for (const f of readdirSync(r)) if (f.endsWith('.html')) files.push(join(r, f)); } catch {} }

const urls = new Map(); // url -> {where:Set}
for (const f of files) {
  let t; try { t = readFileSync(f, 'utf8'); } catch { continue; }
  const area = f.split('/')[0].replace(/\..*/, '');
  for (const m of t.matchAll(ANY_RE)) {
    const u = m[0].replace(/&amp;/g, '&');
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(area);
  }
  for (const m of t.matchAll(SB_RE)) {
    const u = m[0];
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(area);
  }
}
const host = (u) => { try { return new URL(u).host; } catch { return 'bad'; } };
const kind = (u) => /supabase\.co\/storage/.test(u) ? 'supabase' : /ik\.imagekit\.io\/w6hxfnwmw/.test(u) ? 'imagekit_own'
  : /stermontarcade\.co\.ke|stermontmall\.github\.io/.test(u) ? 'github_pages' : 'third_party';
const list = [...urls.keys()].map((u) => ({ url: u, kind: kind(u), host: host(u), areas: [...urls.get(u)] }));

async function probe(u, opts = {}) {
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'stermont-image-audit/1' } });
    const ct = r.headers.get('content-type') || '';
    const buf = r.ok ? new Uint8Array(await r.arrayBuffer()) : new Uint8Array();
    return { status: r.status, ct, bytes: buf.length, ok: r.ok && /^image\//i.test(ct) && buf.length > 500, err: r.ok ? '' : (r.headers.get('x-sb-error') || '') };
  } catch (e) { return { status: 0, ct: '', bytes: 0, ok: false, err: String(e.message || e) }; }
}
async function pool(items, fn) {
  let i = 0; const out = new Array(items.length);
  await Promise.all(Array.from({ length: CONC }, async () => { for (;;) { const k = i++; if (k >= items.length) return; out[k] = await fn(items[k], k); } }));
  return out;
}

const sb = list.filter((x) => x.kind === 'supabase');
let direct402 = 0;
const directSamples = [];
for (const x of sb.slice(0, SAMPLE)) { const r = await probe(x.url); directSamples.push({ url: x.url, ...r }); if (r.status === 402) direct402++; }

await pool(sb, async (x) => {
  const m = /public\/([^\/]+)\/(.+)$/.exec(x.url);
  const path = m ? m[1] + '/' + m[2] : '';
  x.proxy = await probe(`${IK}/supabase/tr:w-16,q-50,f-auto/${x.url}`);
  x.native = await probe(`${IK}/${path}?tr=w-16,q-50`);
});
await pool(list.filter((x) => x.kind !== 'supabase'), async (x) => { x.direct = await probe(x.url); });

const c = (arr, f) => arr.filter(f).length;
const by = {};
for (const x of list) by[x.kind] = (by[x.kind] || 0) + 1;
const summary = {
  generated: new Date().toISOString(), unique_urls: list.length, by_kind: by, files_scanned: files.length,
  supabase_direct_samples: directSamples, supabase_direct_samples_402: direct402,
  supabase_via_imagekit_proxy_ok: c(sb, (x) => x.proxy.ok), supabase_via_imagekit_proxy_fail: c(sb, (x) => !x.proxy.ok),
  proxy_status_counts: Object.entries(sb.reduce((a, x) => (a[x.proxy.status] = (a[x.proxy.status] || 0) + 1, a), {})),
  imagekit_native_copy_ok: c(sb, (x) => x.native.ok), imagekit_native_copy_missing: c(sb, (x) => !x.native.ok),
  github_pages_ok: c(list, (x) => x.kind === 'github_pages' && x.direct.ok), github_pages_broken: c(list, (x) => x.kind === 'github_pages' && !x.direct.ok),
  third_party_ok: c(list, (x) => x.kind === 'third_party' && x.direct.ok), third_party_broken: c(list, (x) => x.kind === 'third_party' && !x.direct.ok),
  imagekit_own_ok: c(list, (x) => x.kind === 'imagekit_own' && x.direct.ok),
};
writeFileSync('image-audit.json', JSON.stringify({ summary, items: list }, null, 1));
const md = '## Image source audit\n```json\n' + JSON.stringify(summary, null, 2) + '\n```\n';
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
