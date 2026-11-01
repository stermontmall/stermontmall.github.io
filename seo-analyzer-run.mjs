// Stermont Arcade - checks technical metadata on a deliberately limited set of
// ordinary-retail and general information pages. Do not crawl the full catalogue:
// some restricted categories are intentionally outside this audit's scope.
import { existsSync, appendFileSync } from 'node:fs';

const files = [
  'index.html',
  'products.html',
  'about.html',
  'contact.html',
  'faq.html',
  'shipping.html',
  'returns.html',
  'c/kitchen-dining.html',
  'c/televisions.html',
  'c/phones-tablets.html',
].filter(file => existsSync(file));

if (!files.includes('index.html') || !files.includes('products.html')) {
  console.error('Required safe audit entry pages are missing.');
  process.exit(1);
}

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
  console.log(`seo-analyzer checked ${files.length} safe pages and found ${issues.length} issue(s).`);
  for (const issue of issues.slice(0, 100)) console.log('-', typeof issue === 'string' ? issue : JSON.stringify(issue));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## On-page technical checks (scoped pages)\n\nChecked ${files.length} ordinary-retail/general pages; found **${issues.length}** issue(s).\n` +
      issues.slice(0, 40).map(issue => `- ${typeof issue === 'string' ? issue : JSON.stringify(issue)}`).join('\n') + '\n');
  }
} catch (error) {
  console.error('seo-analyzer execution failed:', error?.stack || error);
  process.exitCode = 1;
}
