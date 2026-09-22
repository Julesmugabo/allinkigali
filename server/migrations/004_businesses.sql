-- 004_businesses.sql
-- Moves BusinessContext off in-memory React state and onto a real table,
-- same "one Context at a time" pattern as News.
--
-- Known, deliberate gap carried over from the design drafted for this
-- under Supabase: customer/seller accounts still aren't real accounts in
-- our `users` table (self-serve sign-up is still local/fake) — so
-- `owner_id` is a plain uuid, not a foreign key, and self-serve
-- registration/editing has no real access-control check here, same as
-- the in-memory version had none. Tighten this once customer auth exists.

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  category text not null,
  name text not null,
  verified boolean not null default false,
  rating numeric(2,1),
  review_count integer not null default 0,
  phone text,
  open_label text,
  hours text,
  services text[] not null default '{}',
  price_from numeric,
  price_unit text,
  currency text not null default 'RWF',
  location text,
  highlights text[] not null default '{}',
  description text not null default '',
  icon text,
  image_url text,
  keywords text[] not null default '{}',
  items jsonb, -- optional fixed price list (gas-cylinder-style sellers only)
  is_available_now boolean not null default true,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
