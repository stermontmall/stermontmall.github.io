-- Stermont Arcade · AI Builder task queue (up to 500 tasks), saved in Supabase.
-- Applied to Supabase on 2026-10-27. Safe to re-run.
-- Only signed-in staff (public.is_staff()) can read or change it. Shoppers and anonymous visitors get nothing.

create table if not exists public.builder_tasks (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 1 and 2000),
  status text not null default 'p' check (status in ('p', 'd', 'f')),   -- p = waiting, d = done, f = failed
  tries integer not null default 0 check (tries >= 0),
  result text check (result is null or char_length(result) <= 600),
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.builder_tasks enable row level security;
revoke all on public.builder_tasks from anon;
drop policy if exists bt_staff on public.builder_tasks;
create policy bt_staff on public.builder_tasks for all using (public.is_staff()) with check (public.is_staff());

-- the queue holds at most 500 tasks, and updated_at follows every change
create or replace function public.builder_tasks_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.builder_tasks) >= 500 then
      raise exception 'The builder queue is full (500 tasks). Clear finished tasks first.';
    end if;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
revoke all on function public.builder_tasks_guard() from public, anon, authenticated;
drop trigger if exists builder_tasks_guard on public.builder_tasks;
create trigger builder_tasks_guard before insert or update on public.builder_tasks for each row execute function public.builder_tasks_guard();
