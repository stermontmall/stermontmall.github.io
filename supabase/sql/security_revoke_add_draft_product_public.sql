-- Security PR (isolated): stop anonymous / signed-in browser roles from calling the privileged product-insert helper.
-- NOT applied to production by this PR. Apply as a reviewed migration after merge.
--
-- Evidence (read-only, 2026-11-16): the seven-argument overload currently has EXECUTE for PUBLIC, anon, authenticated and
-- service_role (acl {=X,postgres=X,anon=X,authenticated=X,service_role=X}); the six-argument overload is already
-- postgres + service_role only and delegates to the seven-argument one as SECURITY DEFINER (owner postgres), so it is unaffected.
-- No storefront, mobile-shell or admin JavaScript calls add_draft_product; the deployed ai-add-product Edge Function inserts via the
-- service-role REST API and only calls is_staff() with the user's JWT. Product posting runs as service_role / postgres.
--
-- Scope: this function only. No checkout, order, voucher, tracking, review or M-Pesa/card payment function is touched.
-- is_staff() and search_path settings are deliberately NOT changed here (see docs/security/security-definer-followup-2026-11-16.md).

revoke execute on function public.add_draft_product(text, numeric, bigint, text, text, text, numeric) from public, anon, authenticated;
grant  execute on function public.add_draft_product(text, numeric, bigint, text, text, text, numeric) to service_role;

-- Verify afterwards (expect only postgres and service_role):
--   select proacl from pg_proc where oid = 'public.add_draft_product(text,numeric,bigint,text,text,text,numeric)'::regprocedure;
-- Rollback if something unexpected depends on it:
--   grant execute on function public.add_draft_product(text, numeric, bigint, text, text, text, numeric) to anon, authenticated;
