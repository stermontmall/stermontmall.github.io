// Stermont Arcade - runs the seo-analyzer rules over the public pages.
// Called by .github/workflows/site-audit.yml (the workflow installs seo-analyzer first). Never fails the build: it only reports.
import { readdirSync, existsSync, appendFileSync } from 'node:fs';

const dir = d => {
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true }).flatMap(entry => {
    const path = `${d}/${entry.name}`;
    return entry.isDirectory() ? dir(path) : (entry.isFile() && entry.name.endsWith('.html') ? [path] : []);
  });
};
const rootPages = readdirSync('.').filter(f => f.endsWith('.html') && !/^(admin|account|track|404|upload-photos|google|builder)/.test(f));
const files = [...new Set([...rootPages, ...['p','c','blog','services','guides'].flatMap(dir)])];

try {
  const { default: SeoAnalyzer } = await import('seo-analyzer');
  const result = await new SeoAnalyzer()
    .inputFiles(files)
    .addRule('titleLengthRule', { min: 10, max: 75 })
    .addRule('metaBaseRule', { list: ['description', 'viewport'] })
    .addRule('metaSocialRule', { properties: ['og:title', 'og:description', 'og:image', 'twitter:card'] })
    .addRule('canonicalLinkRule')
    .addRule('imgTagWithAltAttributeRule')
    .outputObject(() => {})
    .run();
  const issues = Array.isArray(result) ? result : [];
  console.log(`seo-analyzer checked ${files.length} pages and found ${issues.length} issue(s).`);
  for (const i of issues.slice(0, 100)) console.log('-', typeof i === 'string' ? i : JSON.stringify(i));
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## seo-analyzer\n\nChecked ${files.length} pages, found **${issues.length}** issue(s).\n` + issues.slice(0, 40).map(i => `- ${typeof i === 'string' ? i : JSON.stringify(i)}`).join('\n') + '\n');
} catch (e) {
  console.log('seo-analyzer could not run (not critical):', e.message);
}
