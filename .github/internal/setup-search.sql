-- Stermont Arcade · shopper search analytics
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run twice. It only ADDS one new table.
-- The website records what shoppers search for (the words only: no name, phone, email or account).
-- Anyone browsing can add a row; only your signed-in staff can read or delete them.

create table if not exists public.search_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  term text not null check (char_length(term) between 2 and 80),
  results integer not null default 0 check (results between 0 and 5000),   -- how many items the shopper saw
  source text not null default 'typed' check (source in ('typed', 'suggestion', 'category', 'list')),
  session_id text check (session_id is null or char_length(session_id) <= 40),  -- random per visit, so repeat taps can be told apart
  page text check (page is null or char_length(page) <= 80)
);

create index if not exists search_logs_created_idx on public.search_logs (created_at desc);
create index if not exists search_logs_term_idx on public.search_logs (term);

alter table public.search_logs enable row level security;

drop policy if exists sl_insert on public.search_logs;
create policy sl_insert on public.search_logs
  for insert to anon, authenticated
  with check (char_length(term) between 2 and 80 and results between 0 and 5000);

drop policy if exists sl_staff_select on public.search_logs;
create policy sl_staff_select on public.search_logs
  for select to authenticated using (public.is_staff());

drop policy if exists sl_staff_delete on public.search_logs;
create policy sl_staff_delete on public.search_logs
  for delete to authenticated using (public.is_staff());

revoke all on public.search_logs from anon, authenticated;
grant insert on public.search_logs to anon, authenticated;
grant select, delete on public.search_logs to authenticated;
