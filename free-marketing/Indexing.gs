/**
 * URL-level indexing monitor for Stermont Arcade.
 * Uses the official Search Console URL Inspection API via UrlFetchApp.
 * Import URL + historical Last crawled values into GSC_Indexing before running.
 */

const INDEXING_CONFIG = {
  sheet: 'GSC_Indexing',
  historySheet: 'GSC_Indexing_History',
  maxPerRun: 100,
  headers: [
    'URL', 'Historical Last Crawled', 'Current Verdict', 'Coverage State',
    'Indexing State', 'Robots Txt State', 'Page Fetch State',
    'Google Canonical', 'User Canonical', 'Current Last Crawl',
    'Sitemaps', 'Referring URLs', 'Inspected At', 'Inspection Error'
  ],
  historyHeaders: [
    'URL', 'Inspected At', 'Verdict', 'Coverage State', 'Indexing State',
    'Google Canonical', 'User Canonical', 'Last Crawl', 'Error'
  ]
};

function setupIndexingSheets_() {
  const ss = SpreadsheetApp.getActive();
  let current = ss.getSheetByName(INDEXING_CONFIG.sheet);
  if (!current) current = ss.insertSheet(INDEXING_CONFIG.sheet);
  if (current.getLastRow() === 0) {
    current.getRange(1, 1, 1, INDEXING_CONFIG.headers.length)
      .setValues([INDEXING_CONFIG.headers]).setFontWeight('bold');
    current.setFrozenRows(1);
  }
  let history = ss.getSheetByName(INDEXING_CONFIG.historySheet);
  if (!history) history = ss.insertSheet(INDEXING_CONFIG.historySheet);
  if (history.getLastRow() === 0) {
    history.getRange(1, 1, 1, INDEXING_CONFIG.historyHeaders.length)
      .setValues([INDEXING_CONFIG.historyHeaders]).setFontWeight('bold');
    history.setFrozenRows(1);
  }
}

/**
 * Inspects up to 100 URLs per run. Rows with an existing inspection timestamp
 * are skipped; clear that cell to request a fresh inspection of an individual URL.
 */
function inspectIndexingUrls() {
  setupIndexingSheets_();
  const siteUrl = PropertiesService.getScriptProperties().getProperty('GSC_SITE_URL');
  if (!siteUrl) throw new Error('Configure the Search Console property first.');
  const sh = SpreadsheetApp.getActive().getSheetByName(INDEXING_CONFIG.sheet);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Paste URLs into column A (and historical last-crawled dates into column B), then run this again.');
    return;
  }

  const values = sh.getRange(2, 1, lastRow - 1, INDEXING_CONFIG.headers.length).getValues();
  const updates = [];
  const history = [];
  let inspected = 0;
  let skipped = 0;
  let quotaStop = false;

  for (let i = 0; i < values.length; i++) {
    if (inspected >= INDEXING_CONFIG.maxPerRun) break;
    const url = String(values[i][0] || '').trim();
    if (!url || values[i][12]) { skipped++; continue; }
    if (!isAllowedInspectionUrl_(url, siteUrl)) {
      values[i][13] = 'Skipped: URL is outside the configured Search Console property.';
      updates.push({ row: i + 2, values: values[i] });
      continue;
    }

    const now = new Date();
    let result;
    let errorText = '';
    try {
      result = inspectUrlWithSearchConsole_(url, siteUrl);
    } catch (err) {
      errorText = String(err && err.message ? err.message : err);
      if (/429|quota|rate limit/i.test(errorText)) quotaStop = true;
    }

    const status = result && result.indexStatusResult ? result.indexStatusResult : {};
    const sitemapText = (status.sitemap || []).join('\n');
    const referringText = (status.referringUrls || []).join('\n');
    values[i][2] = status.verdict || '';
    values[i][3] = status.coverageState || '';
    values[i][4] = status.indexingState || '';
    values[i][5] = status.robotsTxtState || '';
    values[i][6] = status.pageFetchState || '';
    values[i][7] = status.googleCanonical || '';
    values[i][8] = status.userCanonical || '';
    values[i][9] = status.lastCrawlTime || '';
    values[i][10] = sitemapText;
    values[i][11] = referringText;
    values[i][12] = now;
    values[i][13] = errorText;
    updates.push({ row: i + 2, values: values[i] });
    history.push([
      url, now, status.verdict || '', status.coverageState || '',
      status.indexingState || '', status.googleCanonical || '',
      status.userCanonical || '', status.lastCrawlTime || '', errorText
    ]);
    inspected++;
    if (quotaStop) break;
    Utilities.sleep(120);
  }

  updates.forEach(item => sh.getRange(item.row, 1, 1, INDEXING_CONFIG.headers.length).setValues([item.values]));
  if (history.length) {
    const hs = SpreadsheetApp.getActive().getSheetByName(INDEXING_CONFIG.historySheet);
    hs.getRange(hs.getLastRow() + 1, 1, history.length, INDEXING_CONFIG.historyHeaders.length).setValues(history);
  }
  const remaining = Math.max(0, values.filter(r => r[0] && !r[12]).length);
  SpreadsheetApp.getUi().alert(
    'Indexing inspection finished.\nInspected: ' + inspected +
    '\nSkipped/already inspected: ' + skipped +
    '\nStill pending: ' + remaining +
    (quotaStop ? '\nStopped at a Google API quota/rate limit; retry later.' : '') +
    '\nHistorical report values were preserved.'
  );
}

function inspectUrlWithSearchConsole_(inspectionUrl, siteUrl) {
  const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({
      inspectionUrl: inspectionUrl,
      siteUrl: siteUrl,
      languageCode: 'en'
    }),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  const body = response.getContentText();
  if (statusCode < 200 || statusCode >= 300) {
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.error && parsed.error.message ? parsed.error.message : body;
    } catch (ignore) {}
    throw new Error('URL Inspection API HTTP ' + statusCode + ': ' + detail);
  }
  const parsed = JSON.parse(body);
  return parsed.inspectionResult || {};
}

function isAllowedInspectionUrl_(url, siteUrl) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (siteUrl.indexOf('sc-domain:') === 0) {
    const domain = siteUrl.substring('sc-domain:'.length).toLowerCase();
    const host = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].split(':')[0].toLowerCase();
    return host === domain || host.endsWith('.' + domain);
  }
  return url.indexOf(siteUrl.replace(/\/$/, '') ) === 0;
}
