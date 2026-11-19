-- Service quote requests (no payment). Already applied to Supabase project oewvtbnmyombbtggamor on 2026-10-31 as migration "service_quotes_table".
-- Anyone (anon) may INSERT a new request; only staff (is_staff()) can read, update or delete; a signed-in customer can read their own.
create table if not exists public.service_quotes (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique check (ref ~ '^SQ-[A-Z0-9]{6}$'),
  created_at timestamptz not null default now(),
  user_id uuid,
  service_id text not null check (char_length(service_id) between 2 and 60),
  service_name text not null check (char_length(service_name) between 2 and 160),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (phone ~ '^\+254[17][0-9]{8}$'),
  email text check (email is null or char_length(email) <= 150),
  county text check (county is null or char_length(county) <= 60),
  location text not null check (char_length(location) between 2 and 200),
  property_type text check (property_type is null or char_length(property_type) <= 60),
  preferred_date date,
  preferred_slot text check (preferred_slot is null or char_length(preferred_slot) <= 40),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  quote_amount numeric check (quote_amount is null or quote_amount >= 0),
  staff_notes text check (staff_notes is null or char_length(staff_notes) <= 2000),
  handled_by text,
  handled_at timestamptz
);
create index if not exists service_quotes_created_idx on public.service_quotes (created_at desc);
create index if not exists service_quotes_status_idx on public.service_quotes (status);
alter table public.service_quotes enable row level security;

drop policy if exists "anyone can request a quote" on public.service_quotes;
create policy "anyone can request a quote" on public.service_quotes
  for insert to anon, authenticated
  with check (status = 'new' and quote_amount is null and staff_notes is null
    and handled_by is null and handled_at is null
    and (user_id is null or user_id = (select auth.uid())));

drop policy if exists "customers read own quotes" on public.service_quotes;
create policy "customers read own quotes" on public.service_quotes
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "staff manage quotes" on public.service_quotes;
create policy "staff manage quotes" on public.service_quotes
  for all to public using (is_staff()) with check (is_staff());
