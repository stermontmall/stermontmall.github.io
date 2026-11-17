-- Batch 18: final inactive catalogue review (85 records).
-- Inactive records are not purchasable storefront listings; no prices are changed or new packs inserted.
-- Apron Star 42WS is a Syngenta seed-treatment product and is excluded.
-- The other 84 inactive non-Syngenta records remain inactive and are intentionally left unchanged.
begin;
do $inactive_review$
begin
  raise notice 'Reviewed 85 inactive product records; no DML applied.';
end
$inactive_review$;
commit;
