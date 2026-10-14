-- Ku Meza — order from your table (restaurants and coffee shops).
-- A table carries a long random QR token and a short typed code (never its
-- number, so nobody can order "to table 4" from outside). The first order
-- opens a session (the table's running tab); a table has at most one open
-- session. Each phone at a table must be confirmed by a waiter on its first
-- order, so an order from someone who isn't there never reaches the kitchen.

create table if not exists place_sections (
  id          uuid primary key default gen_random_uuid(),
  place_type  text not null,
  place_id    text not null,
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_place_sections_place on place_sections (place_type, place_id);

alter table place_members drop constraint if exists place_members_section_fk;
alter table place_members add constraint place_members_section_fk foreign key (section_id) references place_sections(id) on delete set null;

create table if not exists place_tables (
  id          uuid primary key default gen_random_uuid(),
  place_type  text not null,
  place_id    text not null,
  section_id  uuid references place_sections(id) on delete set null,
  label       text not null,
  qr_token    text not null unique,
  short_code  text not null unique,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_place_tables_place on place_tables (place_type, place_id);

create table if not exists table_sessions (
  id                uuid primary key default gen_random_uuid(),
  table_id          uuid not null references place_tables(id) on delete cascade,
  place_type        text not null,
  place_id          text not null,
  status            text not null default 'open' check (status in ('open', 'closed')),
  opened_at         timestamptz not null default now(),
  closed_at         timestamptz,
  closed_by         text,
  total             integer not null default 0,
  payment_method    text,
  bill_requested_at timestamptz
);
create unique index if not exists uq_table_open_session on table_sessions (table_id) where status = 'open';
create index if not exists idx_table_sessions_place on table_sessions (place_type, place_id, status, closed_at);

create table if not exists table_devices (
  session_id   uuid not null references table_sessions(id) on delete cascade,
  device_id    text not null,
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'blocked')),
  distance_m   integer,
  confirmed_by text,
  created_at   timestamptz not null default now(),
  primary key (session_id, device_id)
);

create table if not exists table_orders (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references table_sessions(id) on delete cascade,
  table_id     uuid not null references place_tables(id) on delete cascade,
  place_type   text not null,
  place_id     text not null,
  device_id    text,
  status       text not null check (status in ('needs_confirm', 'placed', 'accepted', 'preparing', 'ready', 'served', 'cancelled', 'rejected')),
  total        integer not null default 0,
  placed_at    timestamptz not null default now(),
  accepted_at  timestamptz,
  preparing_at timestamptz,
  ready_at     timestamptz,
  served_at    timestamptz,
  accepted_by  text,
  served_by    text,
  closed_note  text
);
create index if not exists idx_table_orders_place on table_orders (place_type, place_id, status);
create index if not exists idx_table_orders_session on table_orders (session_id);

create table if not exists table_order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references table_orders(id) on delete cascade,
  menu_item_id text,
  name         text not null,
  price        integer not null,
  qty          integer not null,
  notes        text,
  station      text not null default 'kitchen' check (station in ('kitchen', 'bar'))
);
create index if not exists idx_table_order_items_order on table_order_items (order_id);

create table if not exists service_requests (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references table_sessions(id) on delete cascade,
  table_id    uuid not null references place_tables(id) on delete cascade,
  place_type  text not null,
  place_id    text not null,
  type        text not null check (type in ('call_waiter', 'bill')),
  created_at  timestamptz not null default now(),
  handled_at  timestamptz,
  handled_by  text
);
create index if not exists idx_service_requests_session on service_requests (session_id);
