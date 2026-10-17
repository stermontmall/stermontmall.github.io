-- Stermont Arcade · live chat (logged-in customers <-> staff)
-- One conversation per customer (user_id). Customers can only see and send their own messages.
-- Staff (rows in public.staff, checked by is_staff()) can read every conversation and reply.

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('customer', 'staff')),
  name text check (name is null or char_length(name) <= 80),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  staff_email text,
  read_by_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);
create index if not exists chat_messages_recent_idx on public.chat_messages (created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists cm_customer_select on public.chat_messages;
create policy cm_customer_select on public.chat_messages
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists cm_customer_insert on public.chat_messages;
create policy cm_customer_insert on public.chat_messages
  for insert to authenticated
  with check (user_id = (select auth.uid()) and sender = 'customer' and staff_email is null and read_by_staff = false);

drop policy if exists cm_staff_all on public.chat_messages;
create policy cm_staff_all on public.chat_messages
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Customers get no update/delete policy, so they can never edit or remove messages.
revoke all on public.chat_messages from anon, authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant update (read_by_staff) on public.chat_messages to authenticated;

-- Basic spam guard: at most 12 customer messages per minute per customer.
create or replace function public.chat_rate_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.sender = 'customer' and (
    select count(*) from public.chat_messages
    where user_id = new.user_id and sender = 'customer' and created_at > now() - interval '1 minute'
  ) >= 12 then
    raise exception 'You are sending messages too fast. Please wait a moment.';
  end if;
  return new;
end $$;

drop trigger if exists chat_rate_limit_trg on public.chat_messages;
create trigger chat_rate_limit_trg before insert on public.chat_messages
  for each row execute function public.chat_rate_limit();
