# Stermont Arcade — Free Marketing Intelligence

A no-paid-connector reporting kit built with Google Apps Script, Google Sheets, Google Search Console API and GA4 Data API. It does not use Supermetrics, Windsor, Porter, paid APIs, external libraries or third-party data processors.

## What is included

- Search Console daily clicks, impressions, CTR and average position.
- Search query and landing-page reports.
- GA4 daily active users, sessions, page views, conversions and engagement rate.
- A Google Sheets KPI dashboard.
- Import tabs for Google Ads / Meta Ads CSV exports and verified order exports.
- Daily refresh trigger at approximately 06:00 Africa/Nairobi.
- A native Google Sheets source for a free Looker Studio report.

## Important limitations

1. Google Search Console data is usually delayed by a couple of days; the script deliberately ends its window two days before today.
2. GA4 requires the numeric property ID and the Google account running the script must have Viewer or Analyst access.
3. Google Ads API access requires a developer token and OAuth configuration. This starter deliberately avoids pretending that an API connection exists. Import Google Ads and Meta Ads CSV exports into the provided `Ads_Import` tab; keep the headers unchanged.
4. For sales, export verified orders from the store/admin system and paste them into `Sales_Import`. This prevents advertising-platform conversions from being misrepresented as actual store revenue.
5. This is a private reporting workbook, not a public dashboard. Restrict spreadsheet access to trusted staff.

## Install (about 10–15 minutes)

1. Create a blank Google Sheet named **Stermont Marketing Intelligence**.
2. Open **Extensions → Apps Script**.
3. Replace the starter contents of `Code.gs` with the contents of this folder's `Code.gs`.
4. In Apps Script, click **+ → Script**, name the new file `Indexing`, and paste the contents of this folder's `Indexing.gs` into it. Both script files are required.
5. In Apps Script, open **Project Settings**, enable **Show "appsscript.json" manifest file**, then replace the manifest with this folder's `appsscript.json`.
6. In **Services** (plus icon), confirm **Google Search Console API** and **Google Analytics Data API** are added. If prompted, enable both APIs in the linked Google Cloud project.
7. Save, return to the spreadsheet and reload it.
8. Choose **Stermont Marketing → Set up workbook**.
9. Choose **Stermont Marketing → Configure Google properties**:
   - Search Console property: `sc-domain:stermontarcade.co.ke`
   - GA4 property ID: numeric ID from GA4 Admin → Property details. Leave blank until GA4 access is ready.
10. Choose **Stermont Marketing → Refresh all available data** and approve Google's read-only permissions.
11. Choose **Stermont Marketing → Install daily refresh (06:00)**.

## Search Console indexing monitor

The workbook also creates `GSC_Indexing` and `GSC_Indexing_History`.

1. In Search Console, export the URL list for the issue **Crawled - currently not indexed** (or another selected Page indexing reason).
2. Paste the exact URL values into `GSC_Indexing` column A. Optionally paste the report's historical **Last crawled** values into column B. Keep the header row.
3. Run **Stermont Marketing → Inspect pending indexing URLs**. The script uses Google's URL Inspection API and records the current verdict, coverage state, indexing state, robots status, fetch status, Google-selected canonical, user canonical, last crawl, sitemaps and referring URLs.
4. Each run processes at most 100 pending URLs. Rows with an inspection timestamp are skipped; clear the timestamp in column M for a URL you want to inspect again.
5. Every completed inspection is also appended to `GSC_Indexing_History` so later checks can be compared.

**Important:** URL Inspection is a live snapshot for the exact URL/property and is subject to Google's API quotas and data freshness. It does not guarantee indexing or submit a request for indexing. The report supplied for 31 October 2026 is historical; its 114 count must not be presented as today's count. The PDF list is not imported automatically—paste/export the URL values into the sheet first. The API checks current Google-known status for those URLs, not the full set of all indexed pages.

## Looker Studio

1. Open https://lookerstudio.google.com/.
2. Create a blank report and choose the native **Google Sheets** connector.
3. Select the Stermont Marketing Intelligence spreadsheet.
4. Add `GSC_Daily` and `GA4_Daily` as data sources. Use Date as the date dimension, Clicks / Impressions / Sessions / Active Users as metrics.
5. Add `Ads_Import` and `Sales_Import` when populated. Use Spend_KES and Revenue_KES as currency metrics.
6. Share the report only with intended viewers. The underlying spreadsheet permissions still govern data access.

## Import format

- `Ads_Import`: Date (YYYY-MM-DD), Platform, Campaign, Spend_KES, Clicks, Impressions, Conversions, Revenue_KES.
- `Sales_Import`: Date (YYYY-MM-DD), Order_ID, Status, Revenue_KES, Channel, Product.

Use KES values. For `Sales_Import`, use one row per order, a nonblank unique `Order_ID`, and a trimmed `Status` value of `paid`, `completed`, `fulfilled`, `delivered`, `successful`, or `success` for a successful sale. The dashboard's qualified sales revenue and qualified order count include only those statuses; pending, failed, cancelled, refunded, and other statuses are excluded. Keep status values consistent when importing. If an order is partially refunded, exclude it from this simple KPI or reconcile its net revenue before import.

## Privacy and cost

- No passwords, OAuth tokens or customer records are committed to this repository.
- Google authorizations are held by Apps Script under the installing user's Google account.
- Google quotas and terms apply. The solution has no Supermetrics subscription or third-party connector charge.
- Google services are not a guarantee of zero indirect cost if the Google account or Cloud project uses separately billable products; this script itself uses only the listed free Google services.

## Troubleshooting

- **No Search Console rows:** verify the exact property string and that the executing Google account is a verified owner/full user.
- **GA4 error:** use the numeric property ID, enable Analytics Data API and grant the account access.
- **Authorization error:** rerun the menu action and complete the Google consent screen.
- **Daily trigger missing:** run Install daily refresh again and check Apps Script → Triggers.
