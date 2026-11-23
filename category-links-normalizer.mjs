// Repair category links in published HTML using only category pages present in the current build.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { normalizeCategoryLinks } from './category-links.mjs';

const categories = new Set(
  existsSync('c')
    ? readdirSync('c').filter(file => file.endsWith('.html') && file !== 'index.html').map(file => file.replace(/\.html$/i, ''))
    : []
);
if (!categories.size) {
  console.error('No built category pages found in c/; refusing to rewrite links.');
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

let changedFiles = 0, repairedLinks = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = normalizeCategoryLinks(before, categories);
  if (after !== before) {
    const beforeCount = (before.match(/href=(["'])(?:https:\/\/stermontarcade\.co\.ke)?\/c\/[a-z0-9-]+\.html\1/gi) || []).length;
    const afterCount = (after.match(/href=(["'])(?:https:\/\/stermontarcade\.co\.ke)?\/c\/[a-z0-9-]+\.html\1/gi) || []).length;
    repairedLinks += Math.max(1, beforeCount - afterCount);
    writeFileSync(file, after);
    changedFiles++;
  }
}
console.log(`Category link normalization: ${repairedLinks} link(s) repaired across ${changedFiles} HTML file(s); ${categories.size} built categories available.`);
