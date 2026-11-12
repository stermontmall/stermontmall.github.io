-- Stermont Arcade · admin Accounts page: staff-only list of everyone who created an account.
-- Applied to Supabase on 2026-11-12. Safe to re-run. Non-staff callers get an empty list.
create or replace function public.admin_list_accounts()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  orders_count bigint,
  last_order_at timestamptz
)
language sql stable security definer set search_path = public, auth as $$
  select u.id,
         u.email::text,
         coalesce(u.raw_user_meta_data->>'full_name', '')::text,
         coalesce(nullif(u.phone, ''), u.raw_user_meta_data->>'phone')::text,
         u.created_at,
         u.last_sign_in_at,
         (u.email_confirmed_at is not null),
         count(o.id),
         max(o.created_at)
  from auth.users u
  left join public.orders o on o.user_id = u.id
  where public.is_staff()
  group by u.id
  order by u.created_at desc;
$$;
revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
