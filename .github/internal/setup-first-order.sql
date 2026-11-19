-- Stermont Arcade · first-order-only vouchers
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
-- Adds a "first_order_only" flag to vouchers. A first-order code is refused when the phone number already has
-- an order that was not declined. Checked when the code is applied AND again when the order is placed.

alter table public.vouchers add column if not exists first_order_only boolean not null default false;

create or replace function public.has_prior_order(p_phone text, p_exclude uuid default null)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from orders o
    where o.status <> 'declined'
      and (p_exclude is null or o.id <> p_exclude)
      and right(regexp_replace(o.phone, '\D', '', 'g'), 9) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9)
  );
$$;
revoke all on function public.has_prior_order(text, uuid) from public, anon, authenticated;

drop function if exists public.check_voucher(text, numeric);
create or replace function public.check_voucher(p_code text, p_subtotal numeric, p_phone text default null)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v vouchers%rowtype; d numeric; ph text;
begin
  select * into v from vouchers where code = upper(trim(p_code));
  if not found or not v.active then return jsonb_build_object('ok', false, 'reason', 'That code is not valid.'); end if;
  if v.starts_at is not null and v.starts_at > now() then return jsonb_build_object('ok', false, 'reason', 'This code is not active yet.'); end if;
  if v.expires_at is not null and v.expires_at <= now() then return jsonb_build_object('ok', false, 'reason', 'This code has expired.'); end if;
  if v.max_uses is not null and v.used_count >= v.max_uses then return jsonb_build_object('ok', false, 'reason', 'This code has been fully used.'); end if;
  if coalesce(p_subtotal, 0) < v.min_order then return jsonb_build_object('ok', false, 'reason', 'Spend at least KSh ' || v.min_order::bigint || ' to use this code.'); end if;
  if v.first_order_only then
    ph := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
    if char_length(ph) < 9 then return jsonb_build_object('ok', false, 'reason', 'Enter your phone number above first, then apply this code.'); end if;
    if has_prior_order(p_phone) then return jsonb_build_object('ok', false, 'reason', 'This code is for first orders only.'); end if;
  end if;
  d := case when v.kind = 'percent' then round(p_subtotal * v.value / 100) else least(v.value, p_subtotal) end;
  return jsonb_build_object('ok', true, 'code', v.code, 'discount', d);
end $$;
grant execute on function public.check_voucher(text, numeric, text) to anon, authenticated;

create or replace function public.orders_use_voucher()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v vouchers%rowtype;
begin
  if new.voucher_code is not null then
    select * into v from vouchers where code = upper(new.voucher_code);
    if found and v.first_order_only and has_prior_order(new.phone, new.id) then
      raise exception 'Voucher % is for first orders only.', v.code;
    end if;
    update vouchers set used_count = used_count + 1 where code = upper(new.voucher_code);
  end if;
  return new;
end $$;

update public.vouchers set first_order_only = true, note = 'Welcome offer: 5% off your first order of KSh 1,000 or more' where code = 'WELCOME5';
