# Interim shop backend on PocketBase (while Supabase is blocked)

Why: the free Supabase project is over its cached-egress quota (HTTP 402) until the billing reset on 6 Dec 2026.
This folder prepares a PocketBase backend (hosted free on PocketHost) so the shop can keep working.
**Nothing here deletes or changes anything in Supabase.** When Supabase is back, the shop points back at it.

> Status: the scripts pass their own tests against a *fake* PocketBase server. They have **not** yet been run
> against a real PocketHost instance. Expect to fix small things on the first run; send the error text.

## What you need to do (about 30 minutes)

1. **Create the instance.** Sign up at pockethost.io, create an instance (for example `stermont`), open its
   admin page (`https://<name>.pockethost.io/_/`) and create the admin (superuser) account.
2. **Export the data from Supabase.** Dashboard > Table Editor > pick a table > the "..." menu > *Export to CSV*.
   Export: `products`, `categories`, `vouchers`, `orders`, `reviews`, `product_slug_redirects`.
   Put the files in a folder called `exports`, named exactly `products.csv`, `categories.csv`, and so on.
3. **Create the structure** (needs Node 20 on your computer):
   ```
   PB_URL=https://<name>.pockethost.io PB_ADMIN_EMAIL=you@example.com PB_ADMIN_PASSWORD=your-password node pocketbase/setup.mjs
   ```
4. **Create staff accounts.** In the PocketBase admin open the `users` collection, add each staff member and set
   `role` = `staff`. (Supabase passwords cannot be copied, so everyone sets a new password.)
5. **Import the data:**
   ```
   PB_URL=... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node pocketbase/import.mjs --dir ./exports
   ```
   By default only **active products that have a photo** are imported. Add `--all` to import everything.
   It is safe to run again: rows already imported are skipped.

Never put the admin password in the repository or in a chat.

## What is different from Supabase (on purpose)

- **Wholesale cost is private.** In Supabase, anyone can read `products.cost` through the public API. Here it lives in
  a separate `product_costs` collection that only staff can read.
- **Nobody can make themselves staff.** Sign-up and profile edits cannot set the `role`.
- **Customers cannot mark their own order as paid or handled** when placing it.

## What is NOT included yet

- Making the website talk to PocketBase (a small adapter plus edits to about 20 files). Next step.
- Public voucher checking, guest order tracking by reference and phone, M-Pesa and Paystack automation
  (these were Supabase functions; they need PocketBase hooks, "Phase 2").
- Photos: new photos go to ImageKit. Existing Supabase photo links stay as they are.

## Files

- `schema.mjs` collections, fields and access rules
- `setup.mjs` creates them on your instance (safe to re-run)
- `import.mjs` loads the CSV exports (safe to re-run)
- `csv.mjs`, `csv.test.mjs`, `scripts.mock.test.mjs` helpers and tests: `node pocketbase/csv.test.mjs` and `node pocketbase/scripts.mock.test.mjs`
