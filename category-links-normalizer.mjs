// Repair category links in every customer-facing HTML page using active catalogue categories.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { activeCategorySlugsFromPages, normalizeCategoryLinks, resolveCategorySlug } from './category-links.mjs';

const activeCategories = activeCategorySlugsFromPages(
  readdirSync('c').filter(file => file.endsWith('.html') && file !== 'index.html')
    .map(file => ({ slug: file, html: readFileSync('c/' + file, 'utf8') }))
);
if (!activeCategories.size) {
  console.error('No active category pages found in c/; refusing to rewrite links.');
  process.exit(1);
}

const SKIP = new Set(['node_modules', '.git', '.github', 'mobile-shell', 'supabase', 'tools', 'scripts', 'github']);
const files = [];
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) collect(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path.replace(/^\.\//, ''));
  }
}
collect('.');
const categoryAnchor = /<a\b[^>]*\bhref=["'][^"']*\/c\/([a-z0-9-]+)\.html["'][^>]*>/gi;
let changedFiles = 0, repairedLinks = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  for (const match of before.matchAll(categoryAnchor)) {
    if (resolveCategorySlug(match[1], activeCategories) !== match[1]) repairedLinks++;
  }
  const after = normalizeCategoryLinks(before, activeCategories);
  if (after !== before) {
    writeFileSync(file, after);
    changedFiles++;
  }
}
console.log(`Category links: ${repairedLinks} repaired across ${changedFiles} HTML file(s); ${activeCategories.size} active categories.`);
