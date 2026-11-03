# HANDOFF: Paystack card payments (web checkout), branch `wip-paystack-card-web`

## 2026-11-03 Africa/Nairobi (claude.ai chat, GitHub + Supabase connected)
Owner: "enable card payments on my website". Local branch `wip-paystack-card` could not be pushed, so the checkout change was written straight to GitHub on this branch. It is NOT merged and NOT tested.

### Done
- [x] Supabase backend already live (project `oewvtbnmyombbtggamor`): table `card_payments`, edge functions `paystack-init`, `paystack-status`, `paystack-webhook` (all JWT off, webhook checks Paystack's HMAC signature), trigger `orders_verify_payment` accepts a successful `card_payments` row (reference = `orders.pay_code`, same `order_ref`, `paid_amount >= subtotal`).
- [x] Owner added `PAYSTACK_SECRET_KEY` to the Supabase function secrets (value not seen by Claude).
- [x] `checkout-deferred.js` on this branch (commit a8b4f5a): "Pay by card (Visa or Mastercard)" box on the Review step. Flow: `paystack-init` -> load `https://js.paystack.co/v2/inline.js` -> `resumeTransaction(accessCode)` -> poll `paystack-status` -> fill the payment code with the reference (`PS` + 10 characters) -> existing `place()`. Staff and customer emails, the WhatsApp text and the done screen say "Card reference" instead of "M-Pesa code" when paid by card. M-Pesa flow unchanged.
- [x] Re-checked 2026-11-03 (second pass): the three functions are deployed, `card_payments` has 0 rows (no test yet), trigger present. Remote `wip-paystack-card` is identical to `main` (no unique work); this branch is the only one carrying the change.
- [x] Cache: NO `?v=` bump needed. `sw.js` fetches every `.js` with `cache: 'no-cache'` (network-first), so phones get the new `checkout-deferred.js` on the next load. Only `classic.html` loads it (`?v=2`); `index.html` / the mobile shell hand the cart to `/classic.html?checkout=1`, so card checkout is available from phone and desktop alike.

### NOT done / Next
1. [ ] `node --check checkout-deferred.js` (the sandbox had no copy and no network). Command in a clone: `git fetch origin wip-paystack-card-web && git checkout wip-paystack-card-web && node --check checkout-deferred.js`.
2. [ ] Paystack dashboard > Settings > API Keys & Webhooks: set the webhook URL to `https://oewvtbnmyombbtggamor.supabase.co/functions/v1/paystack-webhook` (owner only).
3. [ ] Test mode end to end: use a `sk_test_` key, add a product to the cart, pay with a Paystack test card, then check `select order_ref, status, paid_amount from card_payments order by created_at desc limit 3;` (status should be `success`) and that the order shows `pay_verified = true`.
4. [ ] Compare the local `wip-paystack-card` with this branch (`git diff wip-paystack-card origin/wip-paystack-card-web`), keep this branch, delete the other (local and remote). Do not merge both.
5. [ ] Only after the test passes: swap in the live `sk_live_` key, open the pull request, merge to `main`.
- Rules kept: nothing in `mpesa_*`, staff or `upload_settings` touched; no secrets in files.
