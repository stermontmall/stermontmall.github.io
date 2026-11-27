## 2026-11-27 (Africa/Nairobi) - Checkout redesign (branch `wip-checkout-redesign`, NOT merged)

### Done
- `checkout.html` rewritten (commit 9214be8): one clean `<style>` block (old file had `<head>` before `<!doctype>` and an unclosed `<style>` that silently dropped the first override rule), purple/lime design matching the order email, live 3-step progress in the hero, Items ordered card with Subtotal / Delivery to <county> / Order total, segmented Delivery/Pickup choice, county list shows fees, dark M-Pesa card with Copy buttons for Paybill and Account number, live "Amount matches" chip, code format hint, sticky bottom bar with total + Place order on phones, success state with copyable order reference, WhatsApp help link.
- All element ids and the order payload / `create_guest_order` call are unchanged. `order-emails.js`, `analytics.js`, `stm_handoff` cart and the `stmCheckout` postMessage are untouched.

### Not verified
- Not opened in a browser or run through tests from this session (no sandbox). Needs a phone-size look and a test order.

### Decisions
- Account number on the M-Pesa card is still `0748888230`, as it was before. The 2026-11-23 WhatsApp change moved WhatsApp to 254789514060; owner to confirm the Paybill account number is correct. Help link uses wa.me/254789514060.

### Next
1. Open the branch preview, check on a phone (320px, 390px) and desktop (>=940px two columns).
2. Run `node no-classic-hop.test.mjs` and `python3 mobile-shell/shell.test.py` (checkout is opened inside the shell).
3. Place one test order, then merge `wip-checkout-redesign` to `main` only when it passes.
