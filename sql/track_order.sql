-- Guest order tracking for the Neon Data API.
-- Returns status information ONLY when the order reference AND phone number both match.
-- It never returns address, email, notes or payment details.
--
-- Run once in the Neon SQL Editor (review first). Rollback:
--   drop function public.track_order(text, text);

create or replace function public.track_order(p_ref text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'found', true,
        'ref', o.ref,
        'status', o.status,
        'stage', o.stage,
        'created_at', o.created_at,
        'items', (
          select coalesce(jsonb_agg(jsonb_build_object('name', x->>'name', 'qty', x->'qty')), '[]'::jsonb)
          from jsonb_array_elements(o.items) x
        )
      )
      from public.orders o
      where upper(o.ref) = upper(trim(p_ref))
        and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
      limit 1
    ),
    jsonb_build_object('found', false)
  );
$$;

revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anonymous;
