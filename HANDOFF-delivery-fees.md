## 2026-11-27 (Africa/Nairobi) - Delivery fees for all 47 counties at checkout (branch `wip-delivery-fees-all-counties`, NOT merged)

### Found
- Neon `public.delivery_fees` already holds all 47 counties (active, public read for role `anonymous`), and `create_guest_order` already adds the fee server-side (adds a "Delivery fee (<county>)" line, order total = items + fee - discount, rejects delivery to a county with no active fee).
- `checkout.html` on main had a hard-coded list of only 39 counties. Missing: West Pokot, Samburu, Marsabit, Wajir, Lamu, Tana River, Turkana, Mandera. Those showed "Choose county" with no fee, and the checkout said the fee would be confirmed on WhatsApp.

### Done
- `checkout.html`: county list + fees now cover all 47 (grouped by region, fee and delivery time shown). Fees are loaded live from Neon `delivery_fees` so the number shown is the number the server adds; an embedded 47-row fallback is used only if that read fails. Fee is added to Order total, M-Pesa amount and bottom bar as soon as the county is picked. Submit is blocked if the county is not in the table.
- Fallback verified identical to Neon (47 rows, 0 differences, SQL EXCEPT both ways).
- Order payload and `create_guest_order` call unchanged. No Neon data changed.

### Left
- Not opened in a browser or tested with a real order (no sandbox). Check on a phone: pick Turkana (KSh 2,100) and Mandera (KSh 3,200), confirm total includes the fee, place a test order, confirm Neon order total and email show the delivery line.
- `shipping.html` still says the fee is told to the customer before paying; wording could say it is added automatically at checkout.
- `checkout-deferred.js` still contains an old 39-county list; not used by `checkout.html` (not confirmed unused elsewhere).

### Decisions
- Keep fees in Neon as the single source of truth (edit `delivery_fees` to change a price, no code change).
- Merge to main only after the test order passes.
