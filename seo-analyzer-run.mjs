// Stermont Arcade - technical metadata checks for general pages and sampled ordinary retail routes.
// Restricted catalogue copy is deliberately not optimized by this audit.
import { existsSync, appendFileSync } from 'node:fs';

const files = [
  'index.html',
  'products.html',
  'about.html',
  'contact.html',
  'faq.html',
  'shipping.html',
  'returns.html',
  // Representative ordinary-retail category pages.
  'c/kitchen-dining.html',
  'c/televisions.html',
  'c/phones-tablets.html',
  'c/appliances.html',
  // Representative ordinary consumer-product pages.
  'p/hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch.html',
  'p/hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres.html',
  'p/kenwood-air-fryer-hfp30-000bk-3-8-litres.html',
  'p/samsung-galaxy-a06-4gb-ram-64gb.html',
  'p/von-twin-tub-semi-automatic-washing-machine-7-5kg-7-5-kg.html',
  // Representative general shopping guides, not chemical or veterinary advice.
  'blog/how-to-buy-a-phone-online-kenya.html',
  'blog/how-to-choose-a-fridge-in-kenya.html',
  'blog/air-fryer-buying-guide-kenya.html',
  'blog/washing-machine-buying-guide-kenya.html',
].filter(file => existsSync(file));

if (!files.includes('index.html') || !files.includes('products.html')) {
  console.error('Required safe audit entry pages are missing.');
  process.exit(1);
}

const twitterCardRule = dom => {
  const tag = dom.window.document.querySelector('head > meta[name="twitter:card"]');
  return Promise.resolve(tag?.getAttribute('content') ? [] : ['Missing or empty Twitter Card meta name']);
};

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

  if (!Array.isArray(issues)) throw new Error('SEO analyzer did not return its expected array report.');
  const issueCount = issues.reduce((total, page) => total + (Array.isArray(page.report) ? page.report.length : 0), 0);
  console.log(`seo-analyzer checked ${files.length} sampled safe pages across /p/, /c/, /blog/ and general pages; found ${issueCount} issue(s).`);
  for (const page of issues) console.log(`- ${page.source}: ${(page.report || []).join('; ')}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    const details = issues.map(page => `- ${page.source}: ${(page.report || []).join('; ')}`).join('\n');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## On-page technical checks (sampled safe routes)\n\nChecked ${files.length} pages across general pages, ordinary-retail /p/, /c/ and general-shopping /blog/ routes; found **${issueCount}** issue(s).\n` +
      (details ? details + '\n' : 'No issues found.\n'));
  }
  if (issueCount > 0) process.exitCode = 1;
} catch (error) {
  console.error('SEO analyzer execution failed:', error?.stack || error);
  process.exitCode = 1;
}
