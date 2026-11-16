# SECURITY DEFINER follow-up — read-only review notes (2026-11-16)

Follows `security-definer-audit-2026-11-15.md`. Project `oewvtbnmyombbtggamor`. Only the SQL file `supabase/sql/security_revoke_add_draft_product_public.sql` proposes a change, and it is not applied by this PR.

## add_draft_product (seven-argument overload) — change proposed
- Current ACL: PUBLIC, anon, authenticated, service_role (+ owner postgres). It inserts rows into `products`, so any visitor could call it through the REST API.
- Call sites checked: repository SQL/docs, storefront, mobile-shell and admin JavaScript (none), and the deployed `ai-add-product` Edge Function v15 (inserts through the service-role REST API; no call). The six-argument overload calls it as a SECURITY DEFINER function owned by postgres, so it keeps working.
- Proposed: revoke from PUBLIC, anon, authenticated; keep service_role. `authenticated` is included because the 2026-11-15 audit's example revoked only PUBLIC and anon, which would have left every signed-in customer able to call it. Drop `authenticated` from the SQL if you want exactly the narrower change.
- Not reviewed: other deployed Edge Functions (only `ai-add-product` was read), and any external scripts holding an anon or user key.

## is_staff() — no change
It must stay executable by anon and authenticated: `ai-add-product` calls `/rest/v1/rpc/is_staff` with the caller's JWT, the admin pages call it, and RLS policies and staff-gated RPCs depend on it. It only returns a boolean for the JWT email. Revisit only with a full policy and call-site review.

## Search paths — no change
`add_draft_product` and `is_staff` already pin `search_path=public`. Open items stay as listed in the 2026-11-15 audit (schema-qualify `storage`, `net`, `cron` in the photo/publishing functions; `log_product_slug_change` keeps `pg_temp` last).

## Explicitly untouched
Checkout, order, voucher, tracking, review, `orders_*` trigger and M-Pesa/card payment functions, plus all grants other than the one above.
