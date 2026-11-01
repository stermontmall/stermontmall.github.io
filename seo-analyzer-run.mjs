// Stermont Arcade - technical metadata checks for general pages and ordinary retail only.
// Restricted catalogue areas are deliberately excluded from this audit.
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

// Twitter Card tags use name=, not property=. The upstream library's
// MetaSocialRule checks the wrong attribute for Twitter tags.
const twitterCardRule = dom => {
  const tag = dom.window.document.querySelector('head > meta[name="twitter:card"]');
  return Promise.resolve(tag?.getAttribute('content') ? [] : ['Missing or empty Twitter Card meta name']);
};

// Static pages may canonically end in .html; do not incorrectly require a slash.
// Validate the canonical's absolute HTTPS URL and expected site host instead.
const canonicalIntegrityRule = dom => {
  const tag = dom.window.document.querySelector('head > link[rel="canonical"]');
  const href = tag?.getAttribute('href');
  if (!href) return Promise.resolve(['Missing canonical link or href']);
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.hostname !== 'stermontarcade.co.ke' || url.search || url.hash) {
      return Promise.resolve(['Canonical must be an absolute HTTPS URL on the primary host without query or hash']);
    }
  } catch {
    return Promise.resolve(['Canonical href is not a valid absolute URL']);
  }
  return Promise.resolve([]);
};

try {
  const { default: SeoAnalyzer } = await import('seo-analyzer');
  let issues;
  await new SeoAnalyzer({ verbose: false })
    .inputFiles(files)
    .useRule('titleLengthRule', { min: 10, max: 75 })
    .useRule('metaBaseRule', { list: ['description', 'viewport'] })
    .useRule('metaDescriptionRule', { min: 70, max: 180 })
    .useRule('imgTagWithAltAttributeRule')
    .addRule(twitterCardRule)
    .addRule(canonicalIntegrityRule)
    .outputObject(report => { issues = report; })
    .run();

  if (!Array.isArray(issues)) {
    throw new Error('SEO analyzer did not return its expected array report.');
  }

  const issueCount = issues.reduce((total, page) => total + (Array.isArray(page.report) ? page.report.length : 0), 0);
  console.log(`seo-analyzer checked ${files.length} safe pages and found ${issueCount} issue(s).`);
  for (const page of issues) {
    console.log(`- ${page.source}: ${(page.report || []).join('; ')}`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const details = issues.map(page => `- ${page.source}: ${(page.report || []).join('; ')}`).join('\n');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## On-page technical checks (scoped pages)\n\nChecked ${files.length} ordinary-retail/general pages; found **${issueCount}** issue(s).\n` +
      (details ? details + '\n' : 'No issues found.\n'));
  }
  if (issueCount > 0) process.exitCode = 1;
} catch (error) {
  console.error('seo-analyzer execution failed:', error?.stack || error);
  process.exitCode = 1;
}
