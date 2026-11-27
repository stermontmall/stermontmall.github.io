## 2026-11-27 (Africa/Nairobi) - Checkout redesign MERGED to main (from `wip-checkout-redesign`)
- `checkout.html` rewritten (modern layout, live 3-step progress, M-Pesa copy buttons, amount chip, sticky pay bar, success state). Payload and `create_guest_order` call unchanged.
- Owner confirmed: M-Pesa Paybill 714777 with account number 0748888230 stays as is. Help link uses wa.me/254789514060.

## 2026-11-27 (Africa/Nairobi) - Delivery fees for all 47 counties (branch `wip-delivery-fees`, NOT merged)

### Found
- Checkout listed only 39 counties. Missing: Marsabit, Mandera, Wajir, Turkana, West Pokot, Samburu, Lamu, Tana River. Fees were hardcoded twice (checkout JS and the SQL `CASE` inside `create_guest_order`), and an unknown county got a delivery fee of 0 (free delivery).
- The server already added the fee to the order total; the checkout only displayed it.

### Done in Neon (LIVE now, project restless-shape-79120240, db stermont)
- New table `public.delivery_fees` (county, region, fee, eta, active, sort): 47 rows, RLS on, `anonymous` read-only (active rows), admin write via `is_store_admin()`.
- `create_guest_order` now reads the fee from `delivery_fees`; a county with no fee is rejected with "We could not find a delivery fee for that county". Everything else in the function is unchanged.
- Existing 39 fees unchanged (300 Nairobi, 400 Kiambu/Machakos/Kajiado, 600 and 800 tiers). New: Marsabit 1000, Samburu 1200, West Pokot 800, Wajir 1900, Lamu 2100, Tana River 2100, Turkana 2100, Mandera 3200.
- Research: G4S Nairobi parcel rates for 0-5 kg incl. VAT (The Kenya Times, 2024), e.g. Garissa 760, Mombasa 660, Marsabit 980, Maralal 1115, Wajir 1838, Lodwar/Lamu/Hola 2083, Mandera 3185; extra KSh 65 per kg above 5 kg. Wells Fargo Courier rates are in the same range (about 360-680 for central, Rift and lake towns).
- Backup of the old function: `archive.create_guest_order_backup_20261127` (column `def`). Rollback: `EXECUTE` that `def`.

### Done in repo (branch only)
- `checkout.html`: county list built from `delivery_fees` (fallback list of the same 47 inside the file), grouped by region with the fee shown, fee note shows estimated delivery time and the 5 kg note.

### Not verified
- Not opened in a browser; no test order placed. The RPC was verified by reading its new definition, not by a test order.

### Next
1. Open the branch/preview, pick a few counties (Nairobi, Kisumu, Mandera), check the total.
2. Place one test order to a far county; check the total in Neon `orders.subtotal` and the order email.
3. Merge `wip-delivery-fees` to `main` only after that. NOTE: live checkout (main) still works: the server already knows all 47 counties.
4. To change a fee later: `update public.delivery_fees set fee=... where county='...'` (checkout reads it; no code change needed).
