-- Stermont Arcade · admin client quotations (price quotes the admin issues to clients, laid out like the receipt).
-- Applied to Supabase project oewvtbnmyombbtggamor on 2026-11-08 as migration "client_quotations_table". Safe to re-run.
-- Only staff (is_staff()) can read or write. There is no public access.
create sequence if not exists public.client_quotation_seq;

create table if not exists public.client_quotations (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('QT-' || to_char(now() at time zone 'Africa/Nairobi', 'YYMM') || '-' || lpad(nextval('public.client_quotation_seq')::text, 4, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text default (auth.jwt() ->> 'email'),
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_company text check (client_company is null or char_length(client_company) <= 160),
  client_phone text check (client_phone is null or char_length(client_phone) <= 30),
  client_email text check (client_email is null or char_length(client_email) <= 150),
  client_pin text check (client_pin is null or char_length(client_pin) <= 30),
  client_address text check (client_address is null or char_length(client_address) <= 300),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100),
  discount_type text not null default 'none' check (discount_type in ('none', 'percent', 'fixed')),
  discount_value numeric not null default 0 check (discount_value >= 0),
  vat_rate numeric not null default 0 check (vat_rate >= 0 and vat_rate <= 100),
  vat_inclusive boolean not null default false,   -- true: prices already include VAT (VAT is shown inside the total); false: VAT is added on top
  delivery_fee numeric not null default 0 check (delivery_fee >= 0),
  deposit_percent numeric not null default 0 check (deposit_percent >= 0 and deposit_percent <= 100),
  valid_days integer not null default 14 check (valid_days between 1 and 365),
  valid_until date,
  payment_terms text check (payment_terms is null or char_length(payment_terms) <= 300),
  delivery_terms text check (delivery_terms is null or char_length(delivery_terms) <= 300),
  notes text check (notes is null or char_length(notes) <= 1000),
  terms text check (terms is null or char_length(terms) <= 2000),
  subtotal numeric not null default 0 check (subtotal >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  vat_amount numeric not null default 0 check (vat_amount >= 0),
  total numeric not null default 0 check (total >= 0),
  sent_at timestamptz,
  accepted_at timestamptz
);
create index if not exists client_quotations_created_idx on public.client_quotations (created_at desc);
create index if not exists client_quotations_status_idx on public.client_quotations (status);
alter table public.client_quotations enable row level security;

drop policy if exists "staff manage client quotations" on public.client_quotations;
create policy "staff manage client quotations" on public.client_quotations
  for all to public using (public.is_staff()) with check (public.is_staff());

revoke all on public.client_quotations from anon;
revoke all on sequence public.client_quotation_seq from anon;

-- added 2026-11-08 (migration "client_quotations_vat_inclusive"): for tables created before this column existed
alter table public.client_quotations add column if not exists vat_inclusive boolean not null default false;

-- added 2026-11-08 (migration "client_quotations_anonymous"): quotation without client details (items and prices only)
alter table public.client_quotations add column if not exists anonymous boolean not null default false;
