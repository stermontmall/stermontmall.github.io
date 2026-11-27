// Sync the existing GitHub blog/SEO pipeline into Neon. No Supabase calls.
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SITE = 'https://stermontarcade.co.ke';
const mode = process.argv[2] || 'content';
const dbUrl = process.env.NEON_DATABASE_URL;
if (!dbUrl) { console.error('NEON_DATABASE_URL is missing. Add it as a GitHub Actions secret; this automation must not report success without a Neon connection.'); process.exit(1); }
const sql = neon(dbUrl);
const read = p => existsSync(p) ? readFileSync(p, 'utf8') : '';
const unescape = s => String(s || '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const meta = (html, pattern) => unescape((html.match(pattern) || [])[1] || '');
const dateFrom = html => (html.match(/"datePublished":"(\d{4}-\d{2}-\d{2})/) || [])[1] || null;

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

  // Parse the summary across line wraps and punctuation. Do not use [^.]*:
  // the report's explanatory "(rotating batch; ...)" text contains punctuation.
  const summary = report.match(/Checked\\s+\\*\\*(\\d+)\\*\\*\\s+pages with Google[\\s\\S]*?\\*\\*(\\d+) indexed\\*\\*,\\s+\\*\\*(\\d+) not indexed\\*\\*/i);
  if (!summary) throw new Error('Could not parse Google indexing summary from index-status.md; refusing to save zero counts.');
  const checked = Number(summary[1]), indexed = Number(summary[2]), notIndexed = Number(summary[3]);
  if (indexed + notIndexed > checked) throw new Error(`Invalid Google indexing totals: ${indexed} indexed + ${notIndexed} not indexed > ${checked} checked.`);

  const parseTable = (heading) => {
    const section = report.split(heading)[1]?.split(/^## /m)[0] || '';
    const rows = [];
    for (const line of section.split('\\n')) {
      const m = line.match(/^\\|\\s*(\\/[^|]+)\\s*\\|\\s*([^|]+)\\s*\\|\\s*([^|]+)\\s*\\|\\s*([^|]*)\\s*\\|$/);
      if (!m || /^\\s*-+\\s*$/.test(m[1])) continue;
      const path = m[1].trim();
      if (!path.startsWith('/')) continue;
      rows.push({
        url: new URL(path, SITE).toString(),
        state: m[2].trim(),
        crawled: m[3].trim(),
        canonical: m[4].trim() ? new URL(m[4].trim(), SITE).toString() : null
      });
    }
    return rows;
  };

  const indexedRows = parseTable('## All pages indexed');
  const failedRows = parseTable('## All pages not indexed');
  if (indexedRows.length + failedRows.length > checked) throw new Error('Per-URL table rows exceed the checked count; refusing to write inconsistent records.');
  if (indexed > 0 && indexedRows.length === 0) throw new Error('Report says pages are indexed but contains no indexed URL table; refusing to mark records stale.');
  if (notIndexed > 0 && failedRows.length === 0) throw new Error('Report says pages are not indexed but contains no failure URL table; refusing to mark records stale.');

  await sql`INSERT INTO public.seo_audits (source,issue_count,report_markdown,metrics)
    VALUES ('google-search-console-url-inspection',${notIndexed},${report},${JSON.stringify({
      checked_pages:checked,indexed_pages:indexed,not_indexed_pages:notIndexed,
      indexed_url_records:indexedRows.length,not_indexed_url_records:failedRows.length
    })}::jsonb)`;

  // Store both PASS and FAIL inspection outcomes. Do not mark every historical row
  // STALE: this is a rotating batch, so URLs not inspected today remain valid prior observations.
  for (const [rows, verdict] of [[indexedRows, 'PASS'], [failedRows, 'FAIL']]) {
    for (const r of rows) {
      await sql`INSERT INTO public.google_index_inspections
        (url,verdict,coverage_state,last_crawl,google_canonical,inspected_at,raw)
        VALUES (${r.url},${verdict},${r.state},${r.crawled && r.crawled !== 'never' && r.crawled !== 'unknown' ? r.crawled : null},
          ${r.canonical},now(),${JSON.stringify({source:'search-console-url-inspection', checked_at:new Date().toISOString()})}::jsonb)
        ON CONFLICT (url) DO UPDATE SET verdict=excluded.verdict,coverage_state=excluded.coverage_state,
          last_crawl=excluded.last_crawl,google_canonical=excluded.google_canonical,
          inspected_at=now(),raw=excluded.raw`;
    }
  }
  console.log(`Neon Google indexing report stored: ${checked} checked, ${indexed} indexed, ${notIndexed} not indexed; ${indexedRows.length + failedRows.length} per-URL outcomes saved (PASS and FAIL).`);
} else if (mode === 'sitemap') {
  const rows = JSON.parse(read('google-sitemap-results.json') || '[]');
  for (const r of rows) await sql`INSERT INTO public.google_sitemap_submissions (sitemap_url,http_status,response_text)
    VALUES (${r.sitemap_url},${r.http_status},${r.response_text || ''})`;
  console.log(`Neon sitemap submission history stored: ${rows.length} results.`);
} else {
  throw new Error(`Unknown sync mode: ${mode}`);
}
