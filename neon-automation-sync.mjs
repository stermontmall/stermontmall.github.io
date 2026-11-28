// Sync the existing GitHub blog/SEO pipeline into Neon. No Supabase calls.
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { splitInspectionResults, inspectionRaw } from './google-index-results.mjs';

const SITE = 'https://stermontarcade.co.ke';
const mode = process.argv[2] || 'content';
const dbUrl = process.env.NEON_DATABASE_URL;
if (!dbUrl) { console.error('NEON_DATABASE_URL is missing. Add it as a GitHub Actions secret; this automation must not report success without a Neon connection.'); process.exit(1); }
const sql = neon(dbUrl);
const read = p => existsSync(p) ? readFileSync(p, 'utf8') : '';
const unescape = s => String(s || '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const meta = (html, pattern) => unescape((html.match(pattern) || [])[1] || '');
const dateFrom = html => (html.match(/"datePublished":"(\d{4}-\d{2}-\d{2})/) || [])[1] || null;

// Cumulative product indexing totals across ALL rotating batches, read back from Neon.
// Only product pages that are currently in sitemap-products.xml are counted, so deleted products do not inflate the numbers.
async function productTotals() {
  const locs = f => [...read(f).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const norm = u => { try { return new URL(u).toString(); } catch { return u; } };
  const productUrls = [...new Set(locs('sitemap-products.xml').filter(u => u.includes('/p/')).map(norm))];
  const rows = productUrls.length
    ? await sql`SELECT verdict, coverage_state, count(*)::int AS n FROM public.google_index_inspections WHERE url = ANY(${productUrls}) GROUP BY 1,2`
    : await sql`SELECT verdict, coverage_state, count(*)::int AS n FROM public.google_index_inspections WHERE url LIKE ${SITE + '/p/%'} GROUP BY 1,2`;
  let indexed = 0, notIndexed = 0;
  const reasons = {};
  for (const r of rows) {
    if (r.verdict === 'PASS') indexed += r.n;
    else if (r.verdict === 'FAIL') { notIndexed += r.n; reasons[r.coverage_state] = (reasons[r.coverage_state] || 0) + r.n; }
  }
  const total = productUrls.length || (indexed + notIndexed);
  const pending = Math.max(0, total - indexed - notIndexed);
  const pct = total ? Math.round(1000 * indexed / total) / 10 : 0;
  return { total, indexed, notIndexed, pending, pct, reasons };
}

if (mode === 'content') {
  const topics = JSON.parse(read('blog-topics.json') || '{"topics":[]}').topics || [];
  for (const t of topics) await sql`INSERT INTO public.content_topics
    (slug,title,angle,keywords,facts,links,status,note,drafted_on,synced_at)
    VALUES (${t.slug},${t.title},${t.angle || ''},${t.keywords || []},${t.facts || []},${t.links || []},${t.status || 'pending'},${t.note || null},${t.drafted || null},now())
    ON CONFLICT (slug) DO UPDATE SET title=excluded.title,angle=excluded.angle,keywords=excluded.keywords,
    facts=excluded.facts,links=excluded.links,status=excluded.status,note=excluded.note,drafted_on=excluded.drafted_on,synced_at=now()`;
  let count = 0;
  if (existsSync('blog')) for (const file of readdirSync('blog').filter(f => f.endsWith('.html') && f !== 'index.html')) {
    const html = read('blog/' + file);
    if (/name=["']robots["'][^>]*noindex/i.test(html)) continue;
    const slug = file.replace(/\.html$/,'');
    const title = meta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g,'').trim() || slug;
    const metaTitle = meta(html, /<title>([\s\S]*?)<\/title>/i);
    const description = meta(html, /<meta name=["']description["'] content=["']([^"']*)["']/i);
    const canonical = meta(html, /<link rel=["']canonical["'] href=["']([^"']+)["']/i);
    const url = SITE + '/blog/' + file;
    const sha = createHash('sha256').update(html).digest('hex');
    await sql`INSERT INTO public.blog_posts (slug,title,url,status,meta_title,meta_description,canonical_url,file_sha,published_at,synced_at)
      VALUES (${slug},${title},${url},'published',${metaTitle || null},${description || null},${canonical || url},${sha},${dateFrom(html)},now())
      ON CONFLICT (slug) DO UPDATE SET title=excluded.title,url=excluded.url,status='published',
      meta_title=excluded.meta_title,meta_description=excluded.meta_description,canonical_url=excluded.canonical_url,
      file_sha=excluded.file_sha,published_at=excluded.published_at,synced_at=now()`;
    count++;
  }
  console.log(`Neon content sync complete: ${topics.length} topics and ${count} published blog posts.`);
} else if (mode === 'seo') {
  const report = read('seo-report.md');
  if (!report) throw new Error('seo-report.md is missing; run seo-check.mjs first.');
  const checked = Number((report.match(/Checked (\d+) pages/i) || [])[1] || 0);
  const issues = Number((report.match(/Found \*\*(\d+)\*\* things to fix/i) || [])[1] || 0);
  const issueGroups = [...report.matchAll(/^### (.+?) \((\d+)\)$/gm)].map(m => ({ issue: m[1], count: Number(m[2]) }));
  await sql`INSERT INTO public.seo_audits (source,issue_count,report_markdown,metrics)
    VALUES ('github-actions-daily-seo',${issues},${report},${JSON.stringify({checked_pages:checked,issue_groups:issueGroups})}::jsonb)`;
  console.log(`Neon SEO audit stored: ${checked} pages checked, ${issues} issues.`);
} else if (mode === 'index') {
  const report = read('index-status.md');
  if (!report) throw new Error('index-status.md is missing; run Google URL Inspection first.');

  // When Google's daily quota is used up nothing was inspected, so there is nothing new to save.
  // Still record an audit row with the cumulative product totals so Neon always has the latest count.
  const quotaOnly = /quota is used up right now/i.test(report);
  let checked = 0, indexed = 0, notIndexed = 0, indexedRows = [], failedRows = [], inspectionErrors = [], requested = 0;

  if (!quotaOnly) {
    // Use the machine-readable Google response, not Markdown tables, as the source of truth.
    const payload = JSON.parse(read('index-results.json') || 'null');
    if (!payload || !Array.isArray(payload.results)) throw new Error('index-results.json is missing or invalid; refusing to save incomplete inspection data.');
    requested = Number(payload.requested_urls) || payload.results.length;
    const split = splitInspectionResults(payload.results);
    checked = split.checked;
    indexedRows = split.indexedRows;
    failedRows = split.failedRows;
    inspectionErrors = split.errors;
    indexed = indexedRows.length;
    notIndexed = failedRows.length;

    const summary = report.match(/Checked\s+\*\*(\d+)\*\*\s+pages with Google[\s\S]*?\*\*(\d+) indexed\*\*,\s+\*\*(\d+) not indexed\*\*/i);
    if (!summary) throw new Error('Could not parse Google indexing summary from index-status.md; refusing to save inconsistent counts.');
    if (Number(summary[1]) !== checked || Number(summary[2]) !== indexed || Number(summary[3]) !== notIndexed)
      throw new Error(`Google report/JSON mismatch: report ${summary[1]}/${summary[2]}/${summary[3]}, JSON ${checked}/${indexed}/${notIndexed}.`);

    // Keep the complete indexStatusResult plus the key diagnostic fields for every successful URL inspection.
    // Individual API errors are retained in the seo_audits metrics below and never overwrite a prior good inspection.
    const checkedAt = payload.generated_at || new Date().toISOString();
    for (const [rows, verdict] of [[indexedRows, 'PASS'], [failedRows, 'FAIL']]) {
      for (const r of rows) {
        await sql`INSERT INTO public.google_index_inspections
          (url,verdict,coverage_state,last_crawl,google_canonical,inspected_at,raw)
          VALUES (${r.url},${verdict},${r.state || 'Unknown'},${r.crawled || null},
            ${r.canonical || null},now(),${JSON.stringify(inspectionRaw(r, checkedAt))}::jsonb)
          ON CONFLICT (url) DO UPDATE SET verdict=excluded.verdict,coverage_state=excluded.coverage_state,
            last_crawl=excluded.last_crawl,google_canonical=excluded.google_canonical,
            inspected_at=now(),raw=excluded.raw`;
      }
    }
  }
  // Cumulative product totals (after this run's rows are saved), stored with the audit.
  const t = await productTotals();
  await sql`INSERT INTO public.seo_audits (source,issue_count,report_markdown,metrics)
    VALUES ('google-search-console-url-inspection',${notIndexed},${report},${JSON.stringify({
      checked_pages:checked,indexed_pages:indexed,not_indexed_pages:notIndexed,
      indexed_url_records:indexedRows.length,not_indexed_url_records:failedRows.length,
      requested_pages:requested,inspection_errors:inspectionErrors.length,
      inspection_error_records:inspectionErrors.map(r => ({url:r.url,error:r.error,rate_limited:!!r.rateLimited})),
      quota_exhausted:quotaOnly,
      products_total:t.total,products_indexed:t.indexed,products_not_indexed:t.notIndexed,
      products_awaiting_check:t.pending,products_indexed_pct:t.pct
    })}::jsonb)`;
  console.log(`Neon Google indexing report stored: ${checked} checked, ${indexed} indexed, ${notIndexed} not indexed, ${inspectionErrors.length} inspection errors; full diagnostics saved for every successful URL.`);
  console.log(`PRODUCTS INDEXED (cumulative): ${t.indexed} of ${t.total} (${t.pct}%).`);
} else if (mode === 'totals') {
  // Read-only: write the cumulative products-indexed headline for the run summary and the daily GitHub issue.
  const t = await productTotals();
  const reasons = Object.entries(t.reasons).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const md = [
    `## Products indexed by Google: **${t.indexed} of ${t.total}** (${t.pct}%)`,
    '',
    '| | Products |', '|---|---|',
    `| Indexed | ${t.indexed} |`,
    `| Checked, not indexed | ${t.notIndexed} |`,
    `| Not checked yet | ${t.pending} |`,
    ''
  ];
  if (reasons.length) {
    md.push('Top reasons products are not indexed:', ...reasons.map(([s, n]) => `- ${s}: ${n}`), '');
  }
  md.push(`_Cumulative across all rotating batches, read from Neon (view `public.product_index_summary`). Updated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC._`, '');
  writeFileSync('index-totals.md', md.join('\n'));
  writeFileSync('index-headline.txt', `${t.indexed} of ${t.total} products indexed`);
  console.log(md.join('\n'));
} else if (mode === 'sitemap') {
  const rows = JSON.parse(read('google-sitemap-results.json') || '[]');
  for (const r of rows) await sql`INSERT INTO public.google_sitemap_submissions (sitemap_url,http_status,response_text)
    VALUES (${r.sitemap_url},${r.http_status},${r.response_text || ''})`;
  console.log(`Neon sitemap submission history stored: ${rows.length} results.`);
} else {
  throw new Error(`Unknown sync mode: ${mode}`);
}
