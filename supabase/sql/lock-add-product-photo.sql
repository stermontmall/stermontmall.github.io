-- Lock public.add_product_photo(text,text,boolean,boolean) to the server only.
-- Problem found 2026-11-10: this SECURITY DEFINER function had no staff check and was
-- executable by PUBLIC, anon and authenticated, so any visitor could call
-- /rest/v1/rpc/add_product_photo. It adds the stored upload passcode and posts to the
-- upload-photos edge function (change a product photo, optionally activate the product).
-- The older 3-argument overload is already locked (postgres + service_role only).
--
-- Nothing in the site code calls this function (only docs mention it). Claude sessions
-- and the Supabase SQL editor run as postgres, which keeps access.

revoke execute on function public.add_product_photo(text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.add_product_photo(text, text, boolean, boolean) to service_role;

-- Verify: only postgres and service_role should be listed.
-- select p.oid::regprocedure, p.proacl::text from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'add_product_photo';

-- Rollback (only if something legitimate breaks):
-- grant execute on function public.add_product_photo(text, text, boolean, boolean) to anon, authenticated;
