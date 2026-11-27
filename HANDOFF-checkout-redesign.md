## 2026-11-27 (Africa/Nairobi) - Checkout redesign MERGED to main (from `wip-checkout-redesign`)

### Done
- `checkout.html` rewritten: one clean `<style>` block (old file had `<head>` before `<!doctype>` and an unclosed `<style>`), purple/lime design matching the order email, live 3-step progress, Items ordered card with Subtotal / Delivery to <county> / Order total, Delivery/Pickup cards, county list shows fees, dark M-Pesa card with Copy buttons, live "Amount matches" chip, code format hint, sticky bottom bar with total + Place order on phones, success state with copyable reference, WhatsApp help link.
- All element ids and the order payload / `create_guest_order` call are unchanged. `order-emails.js`, `analytics.js`, `stm_handoff` cart and the `stmCheckout` postMessage are untouched.
- Merged by the owner via PR from the GitHub compare page.

### Not verified
- Not opened in a browser or run through tests (no sandbox). No test order placed yet. PR checks `validate` / `route-regression` were already failing on earlier PRs.

### Open question
- Account number on the M-Pesa card is still `0748888230`. Owner to confirm the Paybill account number. Help link uses wa.me/254789514060.

### Next
1. After the Pages deploy (about 1 minute), hard-reload https://stermontarcade.co.ke and open checkout from the shop on a phone.
2. Place one test order and confirm it reaches Neon and the order email.
3. If anything breaks, revert the merge commit on `main`.
4. Run `node no-classic-hop.test.mjs` and `python3 mobile-shell/shell.test.py` when a sandbox is available.
