/**
 * Stermont Arcade — Free Marketing Intelligence
 * Google Apps Script. Uses Google's first-party Search Console and GA4 APIs.
 * No paid connectors, external libraries, or third-party data processors.
 */

const CONFIG = {
  timezone: 'Africa/Nairobi',
  lookbackDays: 28,
  sheets: {
    dashboard: 'Dashboard',
    gscDaily: 'GSC_Daily',
    gscQueries: 'GSC_Queries',
    gscPages: 'GSC_Pages',
    ga4Daily: 'GA4_Daily',
    ads: 'Ads_Import',
    sales: 'Sales_Import'
  }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Stermont Marketing')
    .addItem('Set up workbook', 'setupWorkbook')
    .addItem('Configure Google properties', 'configureProperties')
    .addSeparator()
    .addItem('Refresh all available data', 'refreshAll')
    .addItem('Refresh Search Console only', 'refreshSearchConsole')
    .addItem('Refresh GA4 only', 'refreshGA4')
    .addItem('Install daily refresh (06:00)', 'installDailyRefresh')
    .addToUi();
}

function setupWorkbook() {
  const ss = SpreadsheetApp.getActive();
  const specs = [
    [CONFIG.sheets.dashboard, ['Metric', 'Value', 'Notes']],
    [CONFIG.sheets.gscDaily, ['Date', 'Clicks', 'Impressions', 'CTR', 'Average Position']],
    [CONFIG.sheets.gscQueries, ['Date', 'Query', 'Clicks', 'Impressions', 'CTR', 'Average Position']],
    [CONFIG.sheets.gscPages, ['Date', 'Page', 'Clicks', 'Impressions', 'CTR', 'Average Position']],
    [CONFIG.sheets.ga4Daily, ['Date', 'Active Users', 'Sessions', 'Views', 'Conversions', 'Engagement Rate']],
    [CONFIG.sheets.ads, ['Date', 'Platform', 'Campaign', 'Spend_KES', 'Clicks', 'Impressions', 'Conversions', 'Revenue_KES']],
    [CONFIG.sheets.sales, ['Date', 'Order_ID', 'Status', 'Revenue_KES', 'Channel', 'Product']]
  ];
  specs.forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  buildDashboard_();
  SpreadsheetApp.getUi().alert('Workbook ready. Next: Stermont Marketing → Configure Google properties.');
}

function configureProperties() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const site = ui.prompt('Search Console property', 'Enter sc-domain:stermontarcade.co.ke (recommended) or the exact verified URL-prefix property.', ui.ButtonSet.OK_CANCEL);
  if (site.getSelectedButton() !== ui.Button.OK) return;
  const siteValue = site.getResponseText().trim();
  if (!siteValue) throw new Error('A Search Console property is required.');
  props.setProperty('GSC_SITE_URL', siteValue);

  const ga = ui.prompt('GA4 property ID (optional)', 'Enter the numeric GA4 property ID (not the measurement ID). Leave blank to configure GA4 later.', ui.ButtonSet.OK_CANCEL);
  if (ga.getSelectedButton() === ui.Button.OK && ga.getResponseText().trim()) {
    const id = ga.getResponseText().trim();
    if (!/^\d+$/.test(id)) throw new Error('GA4 property ID must contain digits only.');
    props.setProperty('GA4_PROPERTY_ID', id);
  }
  ui.alert('Configuration saved privately in this Apps Script project.');
}

function refreshAll() {
  setupWorkbookIfNeeded_();
  const results = [];
  try { refreshSearchConsole(); results.push('Search Console: refreshed'); }
  catch (e) { results.push('Search Console: ' + e.message); }
  try {
    if (PropertiesService.getScriptProperties().getProperty('GA4_PROPERTY_ID')) {
      refreshGA4(); results.push('GA4: refreshed');
    } else results.push('GA4: skipped (property ID not configured)');
  } catch (e) { results.push('GA4: ' + e.message); }
  buildDashboard_();
  SpreadsheetApp.getUi().alert(results.join('\n'));
}

function refreshSearchConsole() {
  setupWorkbookIfNeeded_();
  const siteUrl = PropertiesService.getScriptProperties().getProperty('GSC_SITE_URL');
  if (!siteUrl) throw new Error('Configure the Search Console property first.');
  const end = new Date();
  end.setDate(end.getDate() - 2); // GSC data is commonly delayed; avoid incomplete days.
  const start = new Date(end);
  start.setDate(start.getDate() - (CONFIG.lookbackDays - 1));
  const startDate = Utilities.formatDate(start, CONFIG.timezone, 'yyyy-MM-dd');
  const endDate = Utilities.formatDate(end, CONFIG.timezone, 'yyyy-MM-dd');

  const daily = gscQuery_(siteUrl, startDate, endDate, ['date']);
  writeRows_(CONFIG.sheets.gscDaily, ['Date','Clicks','Impressions','CTR','Average Position'],
    daily.map(r => [formatGscDate_(r.keys[0]), r.clicks || 0, r.impressions || 0, r.ctr || 0, r.position || 0]));

  const queries = gscQuery_(siteUrl, startDate, endDate, ['date','query']);
  writeRows_(CONFIG.sheets.gscQueries, ['Date','Query','Clicks','Impressions','CTR','Average Position'],
    queries.map(r => [formatGscDate_(r.keys[0]), r.keys[1], r.clicks || 0, r.impressions || 0, r.ctr || 0, r.position || 0]));

  const pages = gscQuery_(siteUrl, startDate, endDate, ['date','page']);
  writeRows_(CONFIG.sheets.gscPages, ['Date','Page','Clicks','Impressions','CTR','Average Position'],
    pages.map(r => [formatGscDate_(r.keys[0]), r.keys[1], r.clicks || 0, r.impressions || 0, r.ctr || 0, r.position || 0]));
  buildDashboard_();
}

function gscQuery_(siteUrl, startDate, endDate, dimensions) {
  const out = [];
  let startRow = 0;
  const pageSize = 25000;
  while (true) {
    const response = SearchConsole.Searchanalytics.query({ startDate, endDate, dimensions, rowLimit: pageSize, startRow }, siteUrl);
    const rows = response.rows || [];
    out.push.apply(out, rows);
    if (rows.length < pageSize) break;
    startRow += pageSize;
  }
  return out;
}

function refreshGA4() {
  setupWorkbookIfNeeded_();
  const id = PropertiesService.getScriptProperties().getProperty('GA4_PROPERTY_ID');
  if (!id) throw new Error('Configure the numeric GA4 property ID first.');
  const end = new Date(); end.setDate(end.getDate() - 1);
  const start = new Date(end); start.setDate(start.getDate() - (CONFIG.lookbackDays - 1));
  const request = {
    dateRanges: [{ startDate: Utilities.formatDate(start, CONFIG.timezone, 'yyyy-MM-dd'), endDate: Utilities.formatDate(end, CONFIG.timezone, 'yyyy-MM-dd') }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'conversions' }, { name: 'engagementRate' }],
    limit: 1000
  };
  const response = AnalyticsData.Properties.runReport(request, 'properties/' + id);
  const rows = (response.rows || []).map(r => {
    const d = r.dimensionValues[0].value;
    const m = r.metricValues.map(v => Number(v.value || 0));
    const date = d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8);
    return [date, m[0], m[1], m[2], m[3], m[4]];
  });
  writeRows_(CONFIG.sheets.ga4Daily, ['Date','Active Users','Sessions','Views','Conversions','Engagement Rate'], rows);
  buildDashboard_();
}

function installDailyRefresh() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.filter(t => t.getHandlerFunction() === 'scheduledRefresh').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('scheduledRefresh').timeBased().everyDays(1).atHour(6).inTimezone(CONFIG.timezone).create();
  SpreadsheetApp.getUi().alert('Daily refresh installed for approximately 06:00 Africa/Nairobi. Google controls the exact trigger minute.');
}

function scheduledRefresh() {
  try { refreshSearchConsole(); } catch (e) { console.error('GSC refresh failed: ' + e.message); }
  try {
    if (PropertiesService.getScriptProperties().getProperty('GA4_PROPERTY_ID')) refreshGA4();
  } catch (e) { console.error('GA4 refresh failed: ' + e.message); }
  buildDashboard_();
}

function buildDashboard_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.sheets.dashboard);
  if (!sh) sh = ss.insertSheet(CONFIG.sheets.dashboard);
  sh.clear();
  sh.getRange('A1:C1').merge().setValue('STERMONT ARCADE — MARKETING INTELLIGENCE').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2:C2').merge().setValue('Free first-party reporting | Time zone: Africa/Nairobi | Search Console data is delayed').setFontColor('#666666');
  const rows = [
    ['Metric','Value','Source / interpretation'],
    ['Google organic clicks', '=SUM(GSC_Daily!B2:B)', 'Search Console; selected rolling window'],
    ['Google impressions', '=SUM(GSC_Daily!C2:C)', 'Search Console; selected rolling window'],
    ['Average CTR', '=IFERROR(B4/B5,0)', 'Clicks ÷ impressions (aggregate)'],
    ['GA4 active users', '=SUM(GA4_Daily!B2:B)', 'GA4; requires property ID'],
    ['GA4 sessions', '=SUM(GA4_Daily!C2:C)', 'GA4; requires property ID'],
    ['GA4 conversions', '=SUM(GA4_Daily!E2:E)', 'GA4 configured conversion events'],
    ['Ad spend (KES)', '=SUM(Ads_Import!D2:D)', 'Paste platform exports into Ads_Import'],
    ['Ad-attributed revenue (KES)', '=SUM(Ads_Import!H2:H)', 'Platform-reported; attribution varies'],
    ['Recorded sales revenue (KES)', '=SUM(Sales_Import!D2:D)', 'Paste verified order exports into Sales_Import'],
    ['Recorded orders', '=COUNTA(Sales_Import!B2:B)', 'Includes all imported order statuses; filter cancelled/refunded manually']
  ];
  sh.getRange(4,1,rows.length,3).setValues(rows);
  sh.getRange('B6').setNumberFormat('0.00%');
  sh.getRange('B11:B13').setNumberFormat('#,##0.00');
  sh.getRange('A4:C4').setFontWeight('bold').setBackground('#e8eef7');
  sh.setFrozenRows(4);
  sh.setColumnWidth(1, 250); sh.setColumnWidth(2, 150); sh.setColumnWidth(3, 390);
  sh.getRange('A16:C18').mergeAcross();
  sh.getRange('A16').setValue('Next: connect this spreadsheet to Looker Studio using its native Google Sheets connector. Do not share the workbook publicly; it may contain business sales data.');
}

function setupWorkbookIfNeeded_() {
  const ss = SpreadsheetApp.getActive();
  Object.values(CONFIG.sheets).forEach(name => { if (!ss.getSheetByName(name)) ss.insertSheet(name); });
  const headers = {
    GSC_Daily:['Date','Clicks','Impressions','CTR','Average Position'],
    GSC_Queries:['Date','Query','Clicks','Impressions','CTR','Average Position'],
    GSC_Pages:['Date','Page','Clicks','Impressions','CTR','Average Position'],
    GA4_Daily:['Date','Active Users','Sessions','Views','Conversions','Engagement Rate'],
    Ads_Import:['Date','Platform','Campaign','Spend_KES','Clicks','Impressions','Conversions','Revenue_KES'],
    Sales_Import:['Date','Order_ID','Status','Revenue_KES','Channel','Product']
  };
  Object.keys(headers).forEach(n => {
    const sh = ss.getSheetByName(n);
    if (sh.getLastRow() === 0) sh.appendRow(headers[n]);
  });
}

function writeRows_(sheetName, headers, rows) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  sh.clearContents();
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  if (rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
  sh.setFrozenRows(1);
}

function formatGscDate_(value) {
  return String(value).slice(0,4) + '-' + String(value).slice(4,6) + '-' + String(value).slice(6,8);
}
