# M-Pesa payment notifications (payments-in)

Records every payment made to your Paybill so staff can see "M-Pesa confirmed" against an order instead of
checking SMS messages by hand. Nothing here changes how customers order or how staff approve orders.

## One-time setup (Supabase dashboard, works on a phone)

1. **Create the tables.** Supabase -> SQL Editor -> New query. Paste the contents of `supabase-mpesa.sql`
   (in the root of this repo) and tap Run. It only adds two new locked-down tables.
2. **Add the keys.** Supabase -> Edge Functions -> Secrets. Add:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   Leave `MPESA_ENV` out while testing (the default is the Safaricom sandbox).
3. **Deploy the function.** Supabase -> Edge Functions -> Deploy a new function (via editor).
   - Name: `payments-in`
   - Paste the contents of `index.ts`
   - Turn **Verify JWT OFF**. Safaricom does not send a login token; the function protects itself with a
     secret token in its URL instead.
4. Tell Claude. It reads the secret token, tests the keys, registers the URLs and sends a fake test payment.

## Going live later (Paybill 714777)

- Use the live Daraja keys from the account that owns the Paybill. Enter them in the Secrets screen
  (never paste them in chat or screenshots) and add `MPESA_ENV` = `production`.
- Register the URLs for the live shortcode with the `register` action.
- Rotate the URL token first: in the SQL Editor run
  `update payment_settings set value = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') where key = 'hook_token';`
  then register again (the old URL stops working).

## What it does not do (yet)

It does not mark orders paid by itself. Approving an order also deducts stock, records the sale and sends
receipt emails, so for now staff still tap approve, with the payment already confirmed.
