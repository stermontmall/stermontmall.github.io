-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
-- Adds M-Pesa STK Push (Safaricom Daraja) payment tracking.

create table if not exists public.mpesa_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_ref text not null check (char_length(order_ref) between 3 and 30),
  phone text not null check (char_length(phone) between 10 and 15),
  amount integer not null check (amount > 0),
  checkout_request_id text not null unique,
  merchant_request_id text,
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled','timeout')),
  result_code integer,
  result_desc text,
  mpesa_receipt text unique,
  paid_amount numeric,
  paid_at timestamptz,
  raw jsonb
);

create index if not exists mpesa_payments_ref_idx on public.mpesa_payments (order_ref);
create index if not exists mpesa_payments_phone_created_idx on public.mpesa_payments (phone, created_at desc);

alter table public.mpesa_payments enable row level security;
revoke all on public.mpesa_payments from anon, authenticated;
grant select on public.mpesa_payments to authenticated;

-- Only staff can read payments from the browser. Edge functions use the service role (bypasses RLS).
drop policy if exists "staff read mpesa payments" on public.mpesa_payments;
create policy "staff read mpesa payments" on public.mpesa_payments
  for select to authenticated using (public.is_staff());

-- Orders get a flag only the database can set: true when a successful STK payment exists
-- for this order ref, with this receipt code, for at least the order total.
alter table public.orders add column if not exists pay_verified boolean not null default false;

create or replace function public.orders_verify_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.pay_verified := false;
  if new.pay_code is not null then
    new.pay_verified := exists (
      select 1 from public.mpesa_payments p
      where p.mpesa_receipt = upper(new.pay_code)
        and p.status = 'success'
        and p.order_ref = new.ref
        and p.paid_amount >= new.subtotal
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.orders_verify_payment() from public, anon, authenticated;

drop trigger if exists orders_verify_payment on public.orders;
create trigger orders_verify_payment before insert on public.orders
  for each row execute function public.orders_verify_payment();
