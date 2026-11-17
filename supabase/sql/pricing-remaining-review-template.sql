-- Batch 3 remaining-catalogue price review staging template.
-- REVIEW ONLY: this file intentionally contains no UPDATE/INSERT against public.products.
-- Add only supplier prices supported by a current, exact Kenyan listing or supplier quotation.
-- Never treat a retail listing as a wholesale quote; record the evidence type and URL.
-- Four-tier markup: < KSh20,000 = 30%; KSh20,000–39,999 = 25%;
-- KSh40,000–60,000 = 20%; > KSh60,000 = 17.5%.
-- Round the final selling price to the nearest KSh50. Apply a minimum 15% margin floor.
-- Before applying any future updates, verify the current price has not changed and
-- review the product identity, exact pack size, stock evidence and market comparators.

create temporary table if not exists pricing_remaining_review (
  product_id text primary key,
  expected_current_price_kes numeric(12,2) not null,
  supplier_wholesale_price_kes numeric(12,2) not null check (supplier_wholesale_price_kes > 0),
  calculated_new_price_kes numeric(12,2) not null check (calculated_new_price_kes > 0),
  evidence_type text not null check (evidence_type in ('supplier_quote','verified_wholesale_listing','retail_estimate')),
  supplier_name text not null,
  source_url text not null check (source_url ~ '^https?://'),
  verified_at timestamptz not null,
  reviewer_note text
);

-- Insert reviewed rows here after verification. This script does not write to production.
select count(*) as staged_review_rows from pricing_remaining_review;
