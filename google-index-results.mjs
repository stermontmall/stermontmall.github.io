// Pure helpers for preserving Google Search Console URL Inspection outcomes.
export function splitInspectionResults(results) {
  const errors = results.filter(row => row.error);
  const successful = results.filter(row => !row.error);
  const indexedRows = successful.filter(row => row.verdict === 'PASS');
  const failedRows = successful.filter(row => row.verdict !== 'PASS');
  return { checked: successful.length, indexedRows, failedRows, errors };
}

export function inspectionRaw(row, checkedAt) {
  return {
    source: 'search-console-url-inspection',
    checked_at: checkedAt,
    robots_txt_state: row.robots || null,
    page_fetch_state: row.fetch || null,
    indexing_state: row.indexing || null,
    user_canonical: row.userCanonical || null,
    sitemap: row.sitemap || [],
    referring_urls: row.referringUrls || [],
    crawled_as: row.crawledAs || null,
    google_index_status: row.raw || null
  };
}
