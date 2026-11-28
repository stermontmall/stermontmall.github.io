-- Keep the dashboard aligned with current sitemap-scoped totals produced by neon-automation-sync.mjs.
-- Always return one row, including before the first successful inspection audit exists.
CREATE OR REPLACE VIEW public.product_index_summary AS
WITH latest AS (
  SELECT metrics, created_at
  FROM public.seo_audits
  WHERE source = 'google-search-console-url-inspection'
    AND metrics ? 'products_total'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  COALESCE(NULLIF(latest.metrics ->> 'products_indexed', '')::bigint, 0::bigint) AS products_indexed,
  COALESCE(NULLIF(latest.metrics ->> 'products_not_indexed', '')::bigint, 0::bigint) AS products_not_indexed,
  COALESCE(NULLIF(latest.metrics ->> 'products_awaiting_check', '')::bigint, 0::bigint) AS products_awaiting_recheck,
  COALESCE(NULLIF(latest.metrics ->> 'products_total', '')::integer, 0) AS products_in_sitemap,
  latest.created_at AS last_checked
FROM (SELECT 1) AS anchor
LEFT JOIN latest ON true;
