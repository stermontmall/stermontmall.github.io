# Supabase SECURITY DEFINER audit — read-only snapshot

**Project:** `oewvtbnmyombbtggamor`  
**Captured:** 2026-11-15 (UTC)  
**Scope:** Catalogued every non-system-schema PostgreSQL function returned by `pg_proc.prosecdef = true`, including its identity arguments, owner, function-level EXECUTE ACL and configured `search_path`. Trigger attachments were cross-checked against `pg_trigger`. No function, grant, policy, trigger, checkout or webhook was changed.

> This is a database catalogue and dependency audit, not a complete application call-graph proof. PostgreSQL does not reliably record references to functions inside PL/pgSQL bodies or dynamic SQL in `pg_depend`. EXECUTE grants identify roles that *can* call RPC functions, not proof that the frontend currently does. Edge Function / webhook source and application call sites require a separate source review before any privilege change.

## Summary

- 31 SECURITY DEFINER overload/function entries found across `public`, `pgbouncer`, `storage` and `vault`.
- 25 entries are in the application `public` schema (including overloads); these are the primary review surface.
- Supabase-managed `pgbouncer`, `storage` and `vault` functions are listed for completeness and should not be altered by application migrations.
- Security Advisor currently reports 7 anon-executable and 12 authenticated-executable findings. The flagged public RPCs are listed below.
- No SQL changes were made by this report.

## Complete SECURITY DEFINER inventory

| Schema.function | Parameters (identity signature) | Owner | EXECUTE roles from current ACL | Known table/trigger or call-path evidence |
|---|---|---|---|---|
| `public.activate_product_if_photo_ok` | `p_id text` | postgres | postgres, service_role | Reads `products`, `storage.objects`; updates `products.active`. Admin/product-photo publishing path. |
| `public.add_draft_product` | `p_name text, p_price numeric, p_category_id bigint, p_unit text, p_description text, p_source_url text` | postgres | postgres, service_role | Inserts a draft row in `products`; six-argument overload delegates to seven-argument overload. |
| `public.add_draft_product` | `p_name text, p_price numeric, p_category_id bigint, p_unit text, p_description text, p_source_url text, p_markup_pct numeric` | postgres | PUBLIC, anon, authenticated, postgres, service_role | Inserts a draft into `products`, reads `categories`; privileged product-admin operation exposed to anon/authenticated by ACL. |
| `public.add_product_photo` | `p_product_id text, p_image_url text, p_activate boolean` | postgres | postgres, service_role | Product image upload/publish path; reads/writes `products`, uses `net` and storage-related paths. |
| `public.add_product_photo` | `p_product_id text, p_image_url text, p_activate boolean, p_append boolean` | postgres | postgres, service_role | Overload for appending/replacing product photos; product admin path. |
| `public.admin_list_accounts` | `(no parameters)` | postgres | authenticated, postgres, service_role | Reads `auth.users` and order aggregates; administrative account listing. |
| `public.autopublish_photo_batch` | `(no parameters)` | postgres | postgres, service_role | Updates `products.active`, checks `storage.objects`, may unschedule a `cron` job. Scheduled/admin catalogue publishing. |
| `public.check_voucher` | `p_code text, p_subtotal numeric, p_phone text` | postgres | PUBLIC, anon, authenticated, postgres, service_role | Reads `vouchers`, calls `has_prior_order`; customer checkout voucher validation. |
| `public.has_prior_order` | `p_phone text, p_exclude uuid` | postgres | postgres, service_role | Reads `orders`; called internally by voucher validation and the order voucher trigger. |
| `public.is_staff` | `(no parameters)` | postgres | PUBLIC, anon, authenticated, postgres, service_role | Reads `staff` and JWT email; authorization helper used by admin inventory operations. |
| `public.log_product_slug_change` | `(no parameters)` | postgres | postgres, service_role | **Trigger:** `products.trg_log_product_slug_change`; writes `product_slug_redirects` after a product slug changes. |
| `public.orders_force_pending` | `(no parameters)` | postgres | postgres, service_role | **Trigger:** `orders.orders_force_pending`; sets initial order status/stage and clears handler fields. |
| `public.orders_use_voucher` | `(no parameters)` | postgres | postgres, service_role | **Trigger:** `orders.orders_use_voucher`; reads `vouchers`, calls `has_prior_order`, increments voucher usage. Checkout/order creation. |
| `public.orders_verify_payment` | `(no parameters)` | postgres | postgres, service_role | **Trigger:** `orders.orders_verify_payment`; checks `mpesa_payments` and `card_payments` before setting `pay_verified`. Payment-verification guard on order insert; not itself the webhook endpoint. |
| `public.photo_upload_status` | `p_request_id bigint` | postgres | postgres, service_role | Reads `net._http_response`; internal product-photo upload status path. |
| `public.post_product` | `p_name text, p_source_price numeric, p_category_id bigint, p_unit text, p_description text, p_source_url text` | postgres | postgres, service_role | Inserts a draft in `products`, reads `categories`; product-admin publishing path. |
| `public.rate_order_lookup` | `p_ref text, p_key uuid` | postgres | anon, authenticated, postgres, service_role | Reads `orders` and `reviews`; customer order-review lookup after delivery. |
| `public.rate_order_submit` | `p_ref text, p_key uuid, p_product text, p_rating integer, p_body text` | postgres | anon, authenticated, postgres, service_role | Reads `orders`, inserts `reviews`; customer review submission after delivery. |
| `public.recent_purchases` | `(no parameters)` | postgres | anon, authenticated, postgres, service_role | Reads recent `orders`; public recent-purchase/social-proof feed. |
| `public.record_loss` | `p_id text, p_qty integer, p_reason text, p_note text` | postgres | authenticated, postgres, service_role | Calls `is_staff`; reads/updates `products`, inserts `loss_logs`; admin stock adjustment. |
| `public.record_sale` | `p_ref text` | postgres | authenticated, postgres, service_role | Calls `is_staff`; reads `orders`, writes `sales_ledger`, updates `products`; admin order fulfilment/inventory. |
| `public.restock_product` | `p_id text, p_qty integer, p_cost numeric, p_supplier text, p_date date` | postgres | authenticated, postgres, service_role | Calls `is_staff`; reads/updates `products`, inserts `stock_restocks`; admin stock receipt. |
| `public.reverse_sale` | `p_ref text` | postgres | authenticated, postgres, service_role | Calls `is_staff`; reads/deletes `sales_ledger`, updates `products`; admin sale reversal. |
| `public.rls_auto_enable` | `(no parameters)` | postgres | postgres, service_role | **Event trigger:** `ensure_rls` on `ddl_command_end`; enables RLS for new public tables. |
| `public.track_order` | `p_ref text, p_phone text` | postgres | anon, authenticated, postgres, service_role | Reads `orders`; customer order tracking RPC, validates reference plus phone suffix. |
| `pgbouncer.get_auth` | `p_usename text` | supabase_admin | pgbouncer, supabase_admin | Supabase-managed PgBouncer authentication hook; do not alter. |
| `storage.protect_active_lifecycle_states` | `(no parameters)` | supabase_storage_admin | supabase_storage_admin | Supabase-managed Storage bucket lifecycle trigger; do not alter. |
| `storage.reconcile_lifecycle_state` | `target_bucket_id text, policy_changed boolean` | supabase_storage_admin | service_role, supabase_storage_admin | Supabase-managed Storage lifecycle reconciliation; do not alter. |
| `storage.wake_lifecycle_state` | `(no parameters)` | supabase_storage_admin | supabase_storage_admin | Supabase-managed Storage lifecycle trigger; do not alter. |
| `vault.create_secret` | `new_secret text, new_name text, new_description text, new_key_id uuid` | supabase_admin | postgres, service_role, supabase_admin | Supabase-managed Vault secret creation; do not alter. |
| `vault.update_secret` | `secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid` | supabase_admin | postgres, service_role, supabase_admin | Supabase-managed Vault secret update; do not alter. |

## Classification: checkout, payment and admin dependencies

### Checkout / customer order flow — preserve until tested end-to-end

- `check_voucher(p_code, p_subtotal, p_phone)` is an anon/authenticated customer-facing RPC. It reads voucher rules and calls `has_prior_order`.
- `orders_use_voucher()` and `orders_force_pending()` are order-insert triggers. Their EXECUTE ACL is not how a customer invokes them; PostgreSQL invokes them through the trigger.
- `orders_verify_payment()` is a BEFORE INSERT trigger that validates an M-Pesa receipt against `mpesa_payments` or a card reference against `card_payments`. It is a payment verification guard, not the M-Pesa callback handler itself.
- `track_order(p_ref, p_phone)` is a customer-facing anon RPC; do not revoke anon access without replacing the customer tracking route.
- `rate_order_lookup` and `rate_order_submit` are customer review flows using a reference/key pair. Keep their intended public access unless the site flow is redesigned and tested.
- `recent_purchases()` is currently granted to anon/authenticated and supplies the recent-purchases feed; determine whether the storefront still calls it before changing grants.

### Admin / catalogue / stock operations — restrict by verified admin call path

- `add_draft_product` (seven-argument overload) is the highest-priority privilege review: current ACL includes PUBLIC and anon, although it inserts privileged product rows. Verify all mobile-shell/admin call sites, then remove public/anon execution and retain only the actual trusted server role or an authenticated staff-gated route.
- `post_product`, `add_product_photo`, `activate_product_if_photo_ok`, `autopublish_photo_batch`, `photo_upload_status` are product/photo publishing operations; current ACL is postgres/service_role.
- `admin_list_accounts`, `record_loss`, `record_sale`, `restock_product`, `reverse_sale` are admin operations. They should remain staff-authorized; their code currently calls `is_staff()` where shown.
- `is_staff()` itself is callable by anon and PUBLIC at present. It only returns a boolean based on the JWT email's presence in `staff`; review its use in RLS and UI before narrowing its ACL.
- `log_product_slug_change()`, `orders_force_pending()`, `orders_use_voucher()`, `orders_verify_payment()` are trigger functions, not normal client RPC entry points.
- `rls_auto_enable()` is database DDL infrastructure; retain its event-trigger attachment and owner-controlled execution.

### M-Pesa webhook distinction

**Live Edge Function inspection found that there is currently no active Daraja callback writer.** `mpesa-callback` (version 22, `verify_jwt=false`) explicitly acknowledges callbacks and records nothing; `stk-push` (version 22) and `stk-status` (version 19) return HTTP 410 because the Daraja STK prompt was removed on 2026-11-12. Therefore, no current M-Pesa webhook code path was found that calls a SECURITY DEFINER database function. `orders_verify_payment()` still remains an order-insert trigger that checks any matching row already present in `mpesa_payments`, but it is not the callback endpoint. Do not change it as part of this SEO PR. If M-Pesa callback processing is reintroduced later, review that new handler's database writes and test the full payment flow before tightening grants.

## Safe hardening plan — recommendations only, not executed

1. **Inventory call sites first.** Search storefront/mobile-shell/admin code and deployed Edge Function source for each `rpc('<function>' ...)`, and identify webhook inserts into `mpesa_payments`. Confirm whether any SQL functions are called by scheduled jobs or triggers.
2. **Pin a safe search path.** For app-owned functions, use a fixed path and schema-qualified names. A common baseline is `SET search_path = pg_catalog, public` (or `SET search_path = public` if the function is deliberately designed around that path); schema-qualify `auth`, `storage`, `net`, `cron` and extension objects. Keep `pg_temp` last if it must be present. Do not blindly replace paths on Supabase-managed functions.
3. **Revoke only after classifying each RPC.** For admin-only routines, after proving no public customer flow depends on them, apply function-signature-specific grants such as:
   ```sql
   REVOKE EXECUTE ON FUNCTION public.add_draft_product(text,numeric,bigint,text,text,text,numeric) FROM PUBLIC, anon;
   GRANT EXECUTE ON FUNCTION public.add_draft_product(text,numeric,bigint,text,text,text,numeric) TO service_role;
   ```
   Prefer a server-side authenticated staff gate over direct browser execution. The above is an example for review only and was **not run**.
4. **Do not revoke the customer RPCs indiscriminately.** `check_voucher`, `track_order`, `rate_order_lookup` and `rate_order_submit` have visible customer-facing semantics and currently grant anon access. If public access is removed, replace each route first and test checkout, voucher redemption, order tracking and review submission.
5. **Keep trigger EXECUTE grants separate from RPC grants.** Trigger functions are invoked by their trigger and do not need to be exposed as callable PostgREST RPCs. Confirm trigger attachment before any ACL changes.
6. **Regression-test before deploying security changes.** Test guest checkout, M-Pesa STK/callback, card payment, voucher validation/redemption, order tracking, customer review, admin account listing, product draft/photo activation and inventory operations. Check Supabase logs and advisors after each narrowly scoped change.

## Search-path observations from the snapshot

- Most app-owned public functions already set a fixed path to `public`.
- `orders_verify_payment()` sets an empty search path and schema-qualifies the payment tables in its body; preserve that intentional hardening unless a reviewed replacement is made.
- `log_product_slug_change()` uses `public, pg_temp`; ensure temporary schema remains last.
- `activate_product_if_photo_ok()`, `add_product_photo()`, `autopublish_photo_batch()` and `photo_upload_status()` include extension schemas (`storage`, `net`, `cron`); schema-qualify these references before considering a narrower path.
- Supabase-managed functions in `pgbouncer`, `storage` and `vault` are outside the application change scope.

## Explicit exclusions

This document does not change function bodies, ownership, grants, RLS policies, triggers, webhook code, checkout logic, or any live database object. Any hardening must be a separate reviewed migration with a tested rollback plan.
