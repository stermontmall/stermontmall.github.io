# SECURITY DEFINER follow-up — read-only review notes (2026-11-18)

Follows `security-definer-followup-2026-11-16.md`. Project `oewvtbnmyombbtggamor`. Only `supabase/sql/security_revoke_send_email_public.sql` proposes a change, and it is not applied by this PR.

## stm_send_email — change proposed
- Added with the server-side order emails migration (`server_side_order_emails`, 2026-11-17). SECURITY DEFINER, `search_path=public, net`, no `is_staff()` gate, makes an outbound HTTP POST to the email provider.
- Current ACL: PUBLIC, anon, authenticated, service_role (+ owner postgres). Anyone with the public anon key can call it through `/rest/v1/rpc/stm_send_email` and send email to any address that appears to come from the store.
- Call sites checked: storefront, mobile-shell, admin JavaScript, repository scripts and SQL (none call it directly). Only `stm_order_email_trg()` (trigger `orders_send_emails` on `orders`) calls it, as owner postgres, so order emails keep working.
- Proposed: revoke from PUBLIC, anon, authenticated; keep service_role.
- Not reviewed: deployed Edge Function source other than what earlier audits read (the function list shows none that look email-related, but their code was not read).

## Checked, no change
- `record_sale`, `reverse_sale`, `restock_product`, `record_loss`, `admin_list_accounts`: each function body checks `is_staff()`, so a signed-in non-staff user cannot use them. `catalog-v10.js` and `admin.html` call them as staff.
- `stm_order_email_trg()`: trigger function; cannot be run as an RPC. Left alone because it is an order function (owner rule).
- `stm_hx(text)`: not SECURITY DEFINER; the advisor's mutable search path finding is low risk. Left alone.

## Dashboard setting (not code)
- Supabase Auth "Leaked password protection" is disabled. It is an Auth setting in the Supabase dashboard, not a migration.

## Explicitly untouched
Checkout, order, voucher, tracking, review, `orders_*` trigger and M-Pesa/card payment functions, and all grants other than the one above.
