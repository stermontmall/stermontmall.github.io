# Changelog

## 2026-11-28
- Initial free reporting kit for Stermont Arcade.
- First-party Search Console and GA4 data collection.
- Google Sheets KPI workbook, daily refresh trigger, and manual Ads / Sales import tabs.
- Setup guide for native Looker Studio reporting.

## 2026-11-28 — Search Console indexing monitor
- Added URL Inspection API workflow with current URL verdict/canonical/crawl signals, a 100-URL execution cap, and append-only inspection history.
- Added separate historical last-crawled input column; historical report data is not treated as current status.
- Added the Apps Script external-request scope required for the official Google API endpoint.

## 2026-11-28 — Sales KPI accuracy
- Dashboard sales revenue and order count now include only explicit successful statuses: paid, completed, fulfilled, delivered, successful, or success.
- Pending, failed, cancelled, refunded, and other statuses are excluded; imports should use one row per order and a nonblank Order_ID.
