-- 007_bookings.sql
-- Moves BookingContext off in-memory React state and onto a real table.
--
-- No field here carries real trust weight the way businesses.verified
-- does, and bookings don't identify a customer at all (no real customer
-- accounts exist yet) — so every route stays open, same as the in-memory
-- version had zero access control on any of this either. Nothing to lock
-- down here, unlike Business's approve/delete.

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  business_id uuid not null references businesses(id) on delete cascade,
  business_name text not null,
  item_label text,
  price_from numeric,
  price_unit text,
  currency text,
  quantity integer not null default 1,
  date text,
  note text not null default '',
  payment_method text,
  status text not null default 'new' check (status in ('new', 'handled', 'no_response')),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
