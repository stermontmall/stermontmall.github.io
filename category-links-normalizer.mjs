// Repair category links in every generated customer-facing HTML page.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { activeCategorySlugsFromPages, normalizeCategoryLinks } from './category-links.mjs';

const activeCategories = activeCategorySlugsFromPages(
  existsSync('c')
    ? readdirSync('c').filter(file => file.endsWith('.html') && file !== 'index.html')
        .map(file => ({ slug: file, html: readFileSync('c/' + file, 'utf8') }))
    : []
);
if (!activeCategories.size) {
  console.error('No active category pages found in c/; refusing to rewrite links.');
  process.exit(1);
}

const files = new Set();
for (const name of readdirSync('.')) if (name.endsWith('.html')) files.add(name);
function collect(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) collect(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.add(path);
  }
}
for (const dir of ['blog', 'guides', 'services', 'pest-control']) collect(dir);
const categoryAnchors = html => html.match(/<a\b[^>]*\bhref=["'][^"']*\/c\/[a-z0-9-]+\.html["']/gi) || [];
let changedFiles = 0, repairedLinks = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = normalizeCategoryLinks(before, activeCategories);
  if (after !== before) {
    repairedLinks += Math.max(0, categoryAnchors(before).length - categoryAnchors(after).length);
    writeFileSync(file, after);
    changedFiles++;
  }
}
console.log(`Category links: ${repairedLinks} repaired across ${changedFiles} HTML file(s); ${activeCategories.size} active categories.`);
