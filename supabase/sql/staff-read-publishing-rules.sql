-- Staff-only read access for the canonical product publishing/pricing rule.
-- Keep row-level security enabled; anonymous shoppers must not read this internal rule.
grant select on table public.publishing_rules to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'publishing_rules'
      and policyname = 'Staff can read publishing rules'
  ) then
    create policy "Staff can read publishing rules"
      on public.publishing_rules
      for select
      to authenticated
      using (public.is_staff());
  end if;
end
$$;
