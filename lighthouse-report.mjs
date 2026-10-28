// Stermont Arcade - turns Lighthouse JSON files (one per page, mobile) into a Core Web Vitals report.
// Usage: node lighthouse-report.mjs <folder-with-json-files>. No installs needed, Node 18+.
// Also writes lh-status.txt ("ok" or "attention") so the weekly workflow can flag regressions in the issue title.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2] || 'lh';
// Google's "good" thresholds for Core Web Vitals. TBT is the lab stand-in for INP. imgKB is our own budget for image weight per page: change it if your pages need more.
const LIM = { perf: 90, lcp: 2500, cls: 0.1, tbt: 200, imgKB: 1000 };
const dot = ok => (ok ? '🟢' : '🔴');
const sec = ms => (ms / 1000).toFixed(1) + ' s';
const kb = b => Math.round(b / 1024).toLocaleString('en') + ' KB';
let rows = '', problems = 0, measured = 0;
const tips = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  let r; try { r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); } catch { rows += `| ${f} | could not be measured | | | | | |\n`; problems++; continue; }
  const a = r.audits || {}, url = r.finalUrl || f;
  const perf = Math.round(((r.categories?.performance?.score) ?? 0) * 100);
  const lcp = a['largest-contentful-paint']?.numericValue ?? 0, cls = a['cumulative-layout-shift']?.numericValue ?? 0, tbt = a['total-blocking-time']?.numericValue ?? 0;
  const items = a['resource-summary']?.details?.items || [];
  const img = items.find(i => i.resourceType === 'image')?.transferSize ?? 0, total = items.find(i => i.resourceType === 'total')?.transferSize ?? 0;
  const ok = [perf >= LIM.perf, lcp <= LIM.lcp, cls <= LIM.cls, tbt <= LIM.tbt, img <= LIM.imgKB * 1024];
  measured++; if (ok.includes(false)) problems++;
  rows += `| ${url} | ${dot(ok[0])} ${perf} | ${dot(ok[1])} ${sec(lcp)} | ${dot(ok[2])} ${cls.toFixed(2)} | ${dot(ok[3])} ${Math.round(tbt)} ms | ${dot(ok[4])} ${kb(img)} | ${kb(total)} |\n`;
  for (const id of ['modern-image-formats', 'uses-optimized-images', 'uses-responsive-images', 'offscreen-images', 'unsized-images']) {
    const x = a[id], save = x?.details?.overallSavingsBytes;
    if (x && x.score != null && x.score < 0.9) tips.push(`- ${url}: ${x.title}${save ? ` (could save about ${kb(save)})` : ''}`);
  }
  Object.values(a).filter(x => x.score != null && x.score < 0.5 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable')
    .sort((p, q) => (q.numericValue || 0) - (p.numericValue || 0)).slice(0, 3).forEach(x => tips.push(`- ${url}: ${x.title}`));
}
if (!measured) problems++;
let md = `# Weekly speed and quality check ${new Date().toISOString().slice(0, 10)}\n\nMobile results from Google Lighthouse on the live site. 🟢 means within Google's "good" range, 🔴 means it needs work.\n\n` +
  `Targets: speed score ${LIM.perf}+, LCP under ${LIM.lcp / 1000} s, CLS under ${LIM.cls}, TBT under ${LIM.tbt} ms (stands in for INP), images under ${LIM.imgKB} KB per page.\n\n` +
  `| Page | Speed score | LCP (main image or text shows) | CLS (layout jump) | TBT (taps feel slow) | Image weight | Total weight |\n|---|---|---|---|---|---|---|\n${rows}`;
md += problems ? `\n**${problems} page${problems === 1 ? '' : 's'} need attention.** If image weight or LCP keeps rising as products are added, compress or resize the newest product photos.\n` : `\nEvery page is within the targets. 🎉\n`;
if (tips.length) md += `\n### Biggest things to fix\n${[...new Set(tips)].join('\n')}\n`;
writeFileSync('lh-status.txt', problems ? 'attention' : 'ok');
console.log(md);
