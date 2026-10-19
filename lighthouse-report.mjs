// Stermont Arcade - turns Lighthouse JSON files (one per page) into a short Markdown score report.
// Usage: node lighthouse-report.mjs <folder-with-json-files>. No installs needed, Node 18+.
import { readdirSync, readFileSync } from 'node:fs';
const dir = process.argv[2] || 'lh';
const cats = [['performance', 'Speed'], ['accessibility', 'Accessibility'], ['best-practices', 'Best practices'], ['seo', 'SEO']];
const dot = s => (s >= 90 ? '🟢' : s >= 50 ? '🟠' : '🔴');
let md = `# Weekly speed and quality check ${new Date().toISOString().slice(0, 10)}\n\nMobile scores out of 100 from Google Lighthouse (green is 90 or more).\n\n| Page | ${cats.map(c => c[1]).join(' | ')} |\n|---|${cats.map(() => '---').join('|')}|\n`;
const tips = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  let r; try { r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); } catch { md += `| ${f} | could not be measured |||| \n`; continue; }
  const sc = cats.map(([k]) => Math.round(((r.categories?.[k]?.score) ?? 0) * 100));
  md += `| ${r.finalUrl || f} | ${sc.map(s => `${dot(s)} ${s}`).join(' | ')} |\n`;
  const bad = Object.values(r.audits || {}).filter(a => a.score != null && a.score < 0.5 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0)).slice(0, 4);
  bad.forEach(a => tips.push(`- ${r.finalUrl || f}: ${a.title}`));
}
if (tips.length) md += `\n### Biggest things to fix\n${[...new Set(tips)].join('\n')}\n`;
console.log(md);
