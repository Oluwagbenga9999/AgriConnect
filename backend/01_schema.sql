-- ============================================================
-- AgriConnect — 01_schema.sql
-- Tables, the auth trigger, and storage buckets.
-- Safe to re-run: everything is IF NOT EXISTS / CREATE OR REPLACE.
-- Run this file BEFORE 02_rls_policies.sql
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES
-- One row per auth.users row. Created automatically by the
-- handle_new_user trigger below (client never inserts directly).
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('farmer', 'buyer')),
  full_name   text,
  phone       text,
  location    text,
  avatar_url  text,
  bio         text,
  crop_types  text[],
  state       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- LISTINGS
-- ------------------------------------------------------------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  farmer_id     uuid not null references public.profiles(id) on delete cascade,
  crop          text not null,
  quantity_kg   numeric not null check (quantity_kg > 0),
  price_per_kg  numeric not null check (price_per_kg > 0),
  location      text not null,
  state         text not null,
  description   text,
  photos        text[] not null default '{}',
  status        text not null default 'available'
                  check (status in ('available', 'sold', 'expired')),
  created_at    timestamptz not null default now()
);

create index if not exists listings_farmer_id_idx  on public.listings (farmer_id);
create index if not exists listings_status_idx     on public.listings (status);
create index if not exists listings_crop_idx       on public.listings (crop);
create index if not exists listings_state_idx      on public.listings (state);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

-- ------------------------------------------------------------
-- MESSAGES
-- listing_id is nullable: sendMessage() allows a direct message
-- with no listing attached.
-- ------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references public.listings(id) on delete set null,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(trim(content)) > 0),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messages_sender_id_idx   on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists messages_listing_id_idx  on public.messages (listing_id);
create index if not exists messages_created_at_idx  on public.messages (created_at);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id) on delete set null,
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  farmer_id     uuid not null references public.profiles(id) on delete cascade,
  amount_kobo   bigint not null check (amount_kobo > 0),
  paystack_ref  text not null unique,
  status        text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'seen', 'packaged', 'shipped', 'delivered', 'received', 'failed')),
  created_at    timestamptz not null default now(),
  seen_at       timestamptz,
  packaged_at   timestamptz,
  shipped_at    timestamptz,
  delivered_at  timestamptz,
  received_at   timestamptz
);

create index if not exists orders_buyer_id_idx     on public.orders (buyer_id);
create index if not exists orders_farmer_id_idx    on public.orders (farmer_id);
create index if not exists orders_status_idx       on public.orders (status);
create index if not exists orders_paystack_ref_idx on public.orders (paystack_ref);

-- ------------------------------------------------------------
-- AUTH TRIGGER: auto-create a profile row on signup.
-- useAuth.ts's signUp() only sets auth metadata (role, full_name,
-- phone) — nothing ever inserts into public.profiles directly, so
-- this trigger is required or every new user will have no profile.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- STORAGE BUCKETS
-- avatars:        useProfile.ts -> uploadAvatar()      (public)
-- listing-photos: useListings.ts -> uploadListingPhotos() (public)
-- Both are public buckets because the app calls getPublicUrl()
-- and stores the returned URL directly on the row.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = true;
