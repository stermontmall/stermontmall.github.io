-- Stermont Arcade: M-Pesa Paybill payment notifications
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
-- Safe to run twice. It only ADDS two new, locked-down tables; it does not touch orders, products or anything else.

-- 1) Private settings. Holds the secret token that is part of the webhook URL. Not readable from the website.
create table if not exists public.payment_settings (
  key text primary key,
  value text not null
);
alter table public.payment_settings enable row level security;
revoke all on public.payment_settings from anon, authenticated;
insert into public.payment_settings (key, value)
  values ('hook_token', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (key) do nothing;

-- 2) Payment confirmations received from Safaricom for your Paybill.
create table if not exists public.mpesa_payments (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  trans_id text not null unique check (char_length(trans_id) between 5 and 40),  -- the M-Pesa code, e.g. SJK1ABC2DE
  trans_time text,
  amount numeric not null check (amount >= 0),
  bill_ref text,
  msisdn text,
  payer_name text,
  short_code text,
  env text not null default 'sandbox' check (env in ('sandbox', 'production'))
);
alter table public.mpesa_payments enable row level security;
revoke all on public.mpesa_payments from anon, authenticated;
grant select on public.mpesa_payments to authenticated;
drop policy if exists "staff read payments" on public.mpesa_payments;
create policy "staff read payments" on public.mpesa_payments
  for select to authenticated using (public.is_staff());   -- only your signed-in staff can read payments
