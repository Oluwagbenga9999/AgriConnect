-- AgriConnect Row Level Security policies
--
-- This migration assumes the tables (profiles, listings, messages, orders)
-- already exist with the columns described in src/types/index.ts. It only
-- adds RLS. If your tables don't exist yet, create them first.
--
-- Run with: supabase db push
-- (or paste into the Supabase SQL editor)

-- ============================================================
-- PROFILES
-- ============================================================
alter table public.profiles enable row level security;

-- Anyone signed in can view any profile (needed for public farmer/buyer profiles)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can only insert their own profile row
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- A user can only update their own profile, and can never change their own role
-- after account creation (prevents a buyer from flipping themselves to 'farmer'
-- or vice versa to bypass role-based UI/route checks).
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

-- Anyone signed in can browse listings
create policy "listings_select_all"
  on public.listings for select
  to authenticated
  using (true);

-- Only farmers can create listings, and only under their own farmer_id
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

-- A farmer can only update/delete their own listings
create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using (farmer_id = auth.uid())
  with check (farmer_id = auth.uid());

create policy "listings_delete_own"
  on public.listings for delete
  to authenticated
  using (farmer_id = auth.uid());

-- ============================================================
-- MESSAGES
-- ============================================================
alter table public.messages enable row level security;

-- A user can only see messages where they are sender or receiver
create policy "messages_select_own"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- A user can only send messages as themselves
create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

-- Only the receiver can mark a message read (used by useMessages.ts to set read=true)
create policy "messages_update_receiver_marks_read"
  on public.messages for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ============================================================
-- ORDERS  (the important one)
-- ============================================================
alter table public.orders enable row level security;

-- Buyer or farmer on the order can view it
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or farmer_id = auth.uid());

-- A buyer can create a pending order for themselves, but ONLY with status
-- 'pending'. They cannot insert a row that's already 'confirmed'.
create policy "orders_insert_own_pending"
  on public.orders for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and status = 'pending'
  );

-- Clients are NEVER allowed to set status to 'confirmed' — only the
-- paystack-webhook Edge Function can do that, because it runs with the
-- service_role key, which bypasses RLS entirely (see below).
--
-- Farmers ARE allowed to advance a 'confirmed' order to 'shipped', and a
-- 'shipped' order to 'delivered' — but nothing else, and only on their own
-- orders, and never touching amount_kobo / paystack_ref / buyer_id / farmer_id.
create policy "orders_update_farmer_fulfillment"
  on public.orders for update
  to authenticated
  using (
    farmer_id = auth.uid()
    and status in ('confirmed', 'shipped')
  )
  with check (
    farmer_id = auth.uid()
    -- only the two forward transitions a farmer is allowed to make
    and (
      (status = 'shipped')
      or (status = 'delivered')
    )
  );

-- No delete policy is created for orders — orders should never be deletable
-- by clients. (No policy = no access, since RLS defaults to deny.)

-- Note: the service_role key used inside supabase/functions/paystack-webhook
-- bypasses RLS by design, which is how the webhook is able to set
-- status = 'confirmed' after verifying the Paystack signature — that is the
-- ONLY path that should ever be able to do so. Do not create a client-facing
-- policy that allows setting status = 'confirmed'.

-- RLS's `with check` clause alone can't stop a farmer from bundling an
-- unrelated column change (e.g. amount_kobo) into the same update call that
-- legitimately marks an order 'shipped'. This trigger enforces that a
-- non-service-role update to `orders` may ONLY change `status` — every
-- other column must stay byte-for-byte identical.
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
    raise exception 'orders: only status may be updated by clients';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_lock_financial_columns_trg on public.orders;
create trigger orders_lock_financial_columns_trg
  before update on public.orders
  for each row
  execute function public.orders_lock_financial_columns();
