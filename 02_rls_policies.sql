-- ============================================================
-- AgriConnect — Final SQL for Supabase
-- One file you can copy into Supabase SQL editor and run once.
-- This version is safe to re-run because it drops existing policies
-- and triggers before recreating them.
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

-- ============================================================
-- LISTINGS
-- ============================================================
alter table public.listings enable row level security;

drop policy if exists "listings_select_all" on public.listings;
create policy "listings_select_all"
  on public.listings for select
  to authenticated
  using (true);

drop policy if exists "listings_insert_own_farmer" on public.listings;
create policy "listings_insert_own_farmer"
  on public.listings for insert
  to authenticated
  with check (
    farmer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'farmer'
    )
  );

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using (farmer_id = auth.uid())
  with check (farmer_id = auth.uid());

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own"
  on public.listings for delete
  to authenticated
  using (farmer_id = auth.uid());

-- ============================================================
-- MESSAGES
-- ============================================================
alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "messages_update_receiver_marks_read" on public.messages;
create policy "messages_update_receiver_marks_read"
  on public.messages for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ============================================================
-- ORDERS
-- ============================================================
alter table public.orders enable row level security;

alter table public.orders
  add column if not exists seen_at      timestamptz,
  add column if not exists packaged_at  timestamptz,
  add column if not exists shipped_at   timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists received_at  timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'seen', 'packaged', 'shipped', 'delivered', 'received', 'failed'));

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or farmer_id = auth.uid());

drop policy if exists "orders_insert_own_pending" on public.orders;
create policy "orders_insert_own_pending"
  on public.orders for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
  );

-- The app flow is: confirmed -> seen -> packaged -> shipped -> delivered -> received.
drop policy if exists "orders_update_farmer_fulfillment" on public.orders;
create policy "orders_update_farmer_fulfillment"
  on public.orders for update
  to authenticated
  using (
    farmer_id = auth.uid()
    and status in ('confirmed', 'seen', 'packaged', 'shipped', 'delivered')
  )
  with check (
    farmer_id = auth.uid()
    and status in ('seen', 'packaged', 'shipped', 'delivered')
  );

-- Buyers can confirm receipt once the item is delivered.
drop policy if exists "orders_update_buyer_received" on public.orders;
create policy "orders_update_buyer_received"
  on public.orders for update
  to authenticated
  using (
    buyer_id = auth.uid()
    and status = 'delivered'
  )
  with check (
    buyer_id = auth.uid()
    and status = 'received'
  );

-- Non-service-role clients can never change financial metadata.
create or replace function public.orders_lock_financial_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.amount_kobo   is distinct from old.amount_kobo
     or new.paystack_ref is distinct from old.paystack_ref
     or new.buyer_id     is distinct from old.buyer_id
     or new.farmer_id    is distinct from old.farmer_id
     or new.listing_id   is distinct from old.listing_id
     or new.created_at   is distinct from old.created_at
  then
    raise exception 'orders: only status and fulfillment timestamps may be updated by clients';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_lock_financial_columns_trg on public.orders;
create trigger orders_lock_financial_columns_trg
  before update on public.orders
  for each row
  execute function public.orders_lock_financial_columns();

create or replace function public.orders_enforce_fulfillment_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.farmer_id is distinct from old.farmer_id
     or new.buyer_id is distinct from old.buyer_id
     or new.listing_id is distinct from old.listing_id
     or new.amount_kobo is distinct from old.amount_kobo
     or new.paystack_ref is distinct from old.paystack_ref
     or new.created_at is distinct from old.created_at
  then
    raise exception 'orders: invalid order mutation';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if old.status = 'confirmed' and new.status = 'seen' then
    new.seen_at = coalesce(new.seen_at, now());
    return new;
  elsif old.status = 'seen' and new.status = 'packaged' then
    new.packaged_at = coalesce(new.packaged_at, now());
    return new;
  elsif old.status = 'packaged' and new.status = 'shipped' then
    new.shipped_at = coalesce(new.shipped_at, now());
    return new;
  elsif old.status = 'shipped' and new.status = 'delivered' then
    new.delivered_at = coalesce(new.delivered_at, now());
    return new;
  elsif old.status = 'delivered' and new.status = 'received' then
    new.received_at = coalesce(new.received_at, now());
    return new;
  end if;

  raise exception 'orders: invalid fulfillment transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists orders_enforce_fulfillment_progression_trg on public.orders;
create trigger orders_enforce_fulfillment_progression_trg
  before update on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.orders_enforce_fulfillment_progression();

-- ============================================================
-- STORAGE BUCKET POLICIES
-- ============================================================
drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_photos_insert_own_folder" on storage.objects;
create policy "listing_photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'farmer'
    )
  );

drop policy if exists "listing_photos_delete_own_folder" on storage.objects;
create policy "listing_photos_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
