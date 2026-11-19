-- Stermont Arcade · guest order tracking (track.html)
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
-- Looks up one order by order number + the phone it was placed with. Returns only status, stage, items and total
-- (never the address, phone or email). Both values must match, and wrong guesses are slowed down.

create or replace function public.track_order(p_ref text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare o orders%rowtype; ph text; items jsonb;
begin
  ph := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  if char_length(trim(coalesce(p_ref, ''))) < 3 or char_length(ph) < 9 then
    return jsonb_build_object('ok', false, 'reason', 'Enter your order number and the phone number you ordered with.');
  end if;
  select * into o from orders
   where upper(ref) = upper(trim(p_ref)) and right(regexp_replace(phone, '\D', '', 'g'), 9) = ph
   limit 1;
  if not found then
    perform pg_sleep(0.4);
    return jsonb_build_object('ok', false, 'reason', 'We could not find an order with those details. Check the order number and phone number.');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', e->>'name', 'qty', e->>'qty')), '[]'::jsonb)
    into items from jsonb_array_elements(o.items) e;
  return jsonb_build_object('ok', true, 'ref', o.ref, 'created_at', o.created_at, 'status', o.status,
    'stage', o.stage, 'method', o.method, 'county', o.county, 'subtotal', o.subtotal, 'items', items);
end $$;

revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
