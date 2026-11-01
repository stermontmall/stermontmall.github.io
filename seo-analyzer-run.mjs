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

try {
  const { default: SeoAnalyzer } = await import('seo-analyzer');
  let issues;
  await new SeoAnalyzer({ verbose: false })
    .inputFiles(files)
    .addRule('titleLengthRule', { min: 10, max: 75 })
    .addRule('metaBaseRule', { list: ['description', 'viewport'] })
    .addRule('metaSocialRule', { properties: ['og:title', 'og:description', 'og:image', 'twitter:card'] })
    .addRule('canonicalLinkRule')
    .addRule('imgTagWithAltAttributeRule')
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
} catch (error) {
  console.error('seo-analyzer execution failed:', error?.stack || error);
  process.exitCode = 1;
}
