-- Stermont Arcade · admin extras: vouchers, expenses, customer messages, reviews.
-- Applied to Supabase on 2026-10-15. Safe to re-run.

-- ---------- vouchers ----------
create table if not exists public.vouchers (
  id bigint generated always as identity primary key,
  code text not null unique check (code = upper(code) and char_length(code) between 3 and 24),
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric not null check (value > 0 and (kind <> 'percent' or value <= 90)),
  min_order numeric not null default 0 check (min_order >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  public_offer boolean not null default false,
  note text check (note is null or char_length(note) <= 200),
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
alter table public.vouchers enable row level security;
drop policy if exists v_staff on public.vouchers;
create policy v_staff on public.vouchers for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists v_public on public.vouchers;
create policy v_public on public.vouchers for select using (active and public_offer and (expires_at is null or expires_at > now()));

-- shoppers check a code without being able to list the table
create or replace function public.check_voucher(p_code text, p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v vouchers%rowtype; d numeric;
begin
  select * into v from vouchers where code = upper(trim(p_code));
  if not found or not v.active then return jsonb_build_object('ok', false, 'reason', 'That code is not valid.'); end if;
  if v.starts_at is not null and v.starts_at > now() then return jsonb_build_object('ok', false, 'reason', 'This code is not active yet.'); end if;
  if v.expires_at is not null and v.expires_at <= now() then return jsonb_build_object('ok', false, 'reason', 'This code has expired.'); end if;
  if v.max_uses is not null and v.used_count >= v.max_uses then return jsonb_build_object('ok', false, 'reason', 'This code has been fully used.'); end if;
  if coalesce(p_subtotal, 0) < v.min_order then return jsonb_build_object('ok', false, 'reason', 'Spend at least KSh ' || v.min_order::bigint || ' to use this code.'); end if;
  d := case when v.kind = 'percent' then round(p_subtotal * v.value / 100) else least(v.value, p_subtotal) end;
  return jsonb_build_object('ok', true, 'code', v.code, 'discount', d);
end $$;
revoke all on function public.check_voucher(text, numeric) from public;
grant execute on function public.check_voucher(text, numeric) to anon, authenticated;

alter table public.orders add column if not exists voucher_code text check (voucher_code is null or char_length(voucher_code) <= 24);
alter table public.orders add column if not exists discount integer not null default 0 check (discount >= 0);

create or replace function public.orders_use_voucher() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.voucher_code is not null then
    update vouchers set used_count = used_count + 1 where code = upper(new.voucher_code);
  end if;
  return new;
end $$;
revoke all on function public.orders_use_voucher() from public, anon, authenticated;
drop trigger if exists orders_use_voucher on public.orders;
create trigger orders_use_voucher after insert on public.orders for each row execute function public.orders_use_voucher();

-- ---------- expenses ----------
create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  spent_on date not null default current_date,
  category text not null check (char_length(category) between 2 and 40),
  amount numeric not null check (amount > 0),
  note text check (note is null or char_length(note) <= 200),
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
drop policy if exists ex_staff on public.expenses;
create policy ex_staff on public.expenses for all using (public.is_staff()) with check (public.is_staff());

-- ---------- customer messages (inbox) ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  phone text check (phone is null or char_length(phone) <= 20),
  email text check (email is null or char_length(email) <= 200),
  body text not null check (char_length(body) between 2 and 1000),
  reply text check (reply is null or char_length(reply) <= 1000),
  replied_by text,
  replied_at timestamptz,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists m_insert on public.messages;
create policy m_insert on public.messages for insert to anon, authenticated with check (status = 'new' and reply is null);
drop policy if exists m_own on public.messages;
create policy m_own on public.messages for select to authenticated using (user_id = auth.uid());
drop policy if exists m_staff on public.messages;
create policy m_staff on public.messages for all using (public.is_staff()) with check (public.is_staff());

-- ---------- product reviews ----------
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  order_ref text,
  product_name text not null check (char_length(product_name) <= 200),
  rating integer not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 600),
  reviewer text check (reviewer is null or char_length(reviewer) <= 80),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  unique (user_id, order_ref, product_name)
);
alter table public.reviews enable row level security;
drop policy if exists r_insert on public.reviews;
create policy r_insert on public.reviews for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists r_read on public.reviews;
create policy r_read on public.reviews for select using (status = 'approved' or user_id = auth.uid() or public.is_staff());
drop policy if exists r_staff on public.reviews;
create policy r_staff on public.reviews for all using (public.is_staff()) with check (public.is_staff());
