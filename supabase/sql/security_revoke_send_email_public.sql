-- Security PR (isolated): stop anonymous / signed-in browser roles from calling the store's email-sending helper.
-- NOT applied to production by this PR. Apply as a reviewed migration after merge.
--
-- Evidence (read-only, 2026-11-18): public.stm_send_email(text,text,text,text,text,text) is SECURITY DEFINER, has no is_staff() gate,
-- performs an outbound HTTP POST (net.http_post) to the email provider, and currently has EXECUTE for PUBLIC, anon, authenticated and
-- service_role (acl {=X,postgres=X,anon=X,authenticated=X,service_role=X}). Anyone with the public anon key can therefore call
-- /rest/v1/rpc/stm_send_email and send arbitrary email (any recipient, subject and HTML) that appears to come from the store.
-- Supabase Security Advisor lint 0028 flags it.
--
-- Why this is safe for order emails: stm_order_email_trg() (trigger orders_send_emails) is SECURITY DEFINER owned by postgres and calls
-- stm_send_email as that owner, so the trigger keeps working without browser roles holding EXECUTE. No storefront, mobile-shell, admin
-- JavaScript, repository script or SQL file calls stm_send_email directly (searched 2026-11-18). service_role keeps EXECUTE.
--
-- Scope: this one function only. No checkout, order, voucher, tracking, review or M-Pesa/card payment function is touched.
-- Deliberately NOT changed here:
--   * stm_order_email_trg(): an order-email trigger function. PostgREST cannot run a trigger function as an RPC, so it is not exploitable
--     today; leave it until the owner approves touching order functions.
--   * is_staff(), check_voucher, track_order, rate_order_lookup, rate_order_submit, recent_purchases (public by design).
--   * the five staff RPCs (record_sale, reverse_sale, restock_product, record_loss, admin_list_accounts): each checks is_staff() inside.

revoke execute on function public.stm_send_email(text, text, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.stm_send_email(text, text, text, text, text, text) to service_role;

-- Verify afterwards (expect only postgres and service_role):
--   select proacl from pg_proc where oid = 'public.stm_send_email(text,text,text,text,text,text)'::regprocedure;
-- Then place one test order and confirm a new row appears in email_log and the "received" email arrives.
-- Rollback if order emails stop:
--   grant execute on function public.stm_send_email(text, text, text, text, text, text) to anon, authenticated;
