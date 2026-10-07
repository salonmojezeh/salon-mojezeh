-- Salon Mojezeh - migration for the new admin/customer features
-- Run once in Supabase SQL Editor, then upload the web files.

alter table public.customers add column if not exists birth_date date;
alter table public.customers add column if not exists free_gift boolean not null default false;
alter table public.customers add column if not exists gift_claimed_at timestamptz;
alter table public.customers add column if not exists club_points integer not null default 0;
alter table public.customers add column if not exists club_level text not null default 'عادی';
alter table public.customers add column if not exists visit_count integer not null default 0;
alter table public.customers add column if not exists note text;

alter table public.barbers add column if not exists image_url text;
alter table public.barbers add column if not exists phone text;
alter table public.barbers add column if not exists role text;
alter table public.barbers add column if not exists active boolean not null default true;

alter table public.services add column if not exists image_url text;
alter table public.services add column if not exists description text;
alter table public.services add column if not exists active boolean not null default true;

alter table public.reservations add column if not exists notes text;
alter table public.reservations add column if not exists updated_at timestamptz default now();

create table if not exists public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  reservation_id uuid null references public.reservations(id) on delete set null,
  author_id uuid null references auth.users(id) on delete set null,
  message text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists customer_messages_customer_idx on public.customer_messages(customer_id, created_at desc);
create index if not exists customer_messages_reservation_idx on public.customer_messages(reservation_id);

alter table public.customer_messages enable row level security;
grant select, insert, update on public.customer_messages to authenticated;

do $$ begin
  create policy customer_messages_customer_read on public.customer_messages
    for select to authenticated
    using (customer_id = my_customer_id() or is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customer_messages_admin_insert on public.customer_messages
    for insert to authenticated
    with check (is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customer_messages_barber_insert on public.customer_messages
    for insert to authenticated
    with check (
      reservation_id is not null
      and exists (
        select 1 from public.reservations r
        where r.id = customer_messages.reservation_id
          and r.barber_id = my_barber_id()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customer_messages_customer_update on public.customer_messages
    for update to authenticated
    using (customer_id = my_customer_id() or is_admin_user())
    with check (customer_id = my_customer_id() or is_admin_user());
exception when duplicate_object then null; end $$;

-- Admin CRUD policies. Existing policies are left untouched; duplicate creation is ignored.
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.barbers to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;

do $$ begin
  create policy admin_manage_customers on public.customers
    for all to authenticated using (is_admin_user()) with check (is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy admin_manage_barbers on public.barbers
    for all to authenticated using (is_admin_user()) with check (is_admin_user());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy admin_manage_services on public.services
    for all to authenticated using (is_admin_user()) with check (is_admin_user());
exception when duplicate_object then null; end $$;

-- Barbers may manage only their own reservations.
do $$ begin
  create policy barber_manage_own_reservations on public.reservations
    for update to authenticated
    using (barber_id = my_barber_id() or is_admin_user())
    with check (barber_id = my_barber_id() or is_admin_user());
exception when duplicate_object then null; end $$;

-- Keep the customer birthday from phone/email signup metadata.
create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_phone_local text;
  v_first text;
  v_last text;
  v_birth date;
begin
  v_phone_local := public.phone_local(new.phone);
  v_first := coalesce(new.raw_user_meta_data->>'first_name','');
  v_last := coalesce(new.raw_user_meta_data->>'last_name','');
  begin
    v_birth := nullif(new.raw_user_meta_data->>'birth_date','')::date;
  exception when others then
    v_birth := null;
  end;

  select id into v_customer_id
  from public.customers
  where (v_phone_local is not null and phone_local = v_phone_local)
     or (new.email is not null and lower(email) = lower(new.email))
  limit 1;

  if v_customer_id is null then
    insert into public.customers(first_name,last_name,phone_local,email,birth_date)
    values(v_first,v_last,v_phone_local,new.email,v_birth)
    returning id into v_customer_id;
  else
    update public.customers
      set first_name = case when v_first <> '' then v_first else first_name end,
          last_name = case when v_last <> '' then v_last else last_name end,
          email = coalesce(new.email,email),
          birth_date = coalesce(v_birth,birth_date)
    where id=v_customer_id;
  end if;

  insert into public.user_profiles(id,role,is_admin,customer_id,active)
  values(new.id,'customer',false,v_customer_id,true)
  on conflict(id) do update set customer_id=excluded.customer_id;
  return new;
end;
$$;
