-- The client dashboard (allinclients.allinkigali.rw): who belongs to which
-- restaurant / coffee shop / wedding venue, and how they sign in.
--   owners & managers  — an allinkigali account (email + password) linked here
--   waiters, kitchen, cashiers — phone + PIN, created by the owner
--   kitchen / bar tablets — a connected device that stays signed in
-- plus the log of every time the allinkigali team viewed or changed a
-- client's dashboard (clients can see it).

create table if not exists place_members (
  id            uuid primary key default gen_random_uuid(),
  place_type    text not null check (place_type in ('restaurant', 'coffeeshop', 'wedding')),
  place_id      text not null,
  user_id       uuid references users(id) on delete cascade,
  role          text not null check (role in ('owner', 'manager', 'waiter', 'kitchen', 'cashier')),
  name          text not null default '',
  phone         text,            -- last 9 digits, e.g. 788123456
  pin_hash      text,
  section_id    uuid,            -- a waiter's section of tables (null = all)
  active        boolean not null default true,
  failed_pins   integer not null default 0,
  locked_until  timestamptz,
  created_by    text,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create index if not exists idx_place_members_place on place_members (place_type, place_id);
create index if not exists idx_place_members_user on place_members (user_id);
create index if not exists idx_place_members_phone on place_members (phone) where phone is not null;
create unique index if not exists uq_place_members_phone on place_members (place_type, place_id, phone) where phone is not null;
create unique index if not exists uq_place_members_user on place_members (place_type, place_id, user_id) where user_id is not null;

create table if not exists place_devices (
  id              uuid primary key default gen_random_uuid(),
  place_type      text not null,
  place_id        text not null,
  label           text not null default 'Kitchen',
  role            text not null default 'kitchen' check (role in ('kitchen', 'waiter')),
  pair_code_hash  text,          -- one-time code typed on the tablet to connect it
  pair_expires_at timestamptz,
  active          boolean not null default true,
  created_by      text,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz
);
create index if not exists idx_place_devices_place on place_devices (place_type, place_id);

create table if not exists support_access_log (
  id            bigserial primary key,
  place_type    text not null,
  place_id      text not null,
  staff_user_id uuid,
  staff_name    text,
  staff_role    text,
  action        text not null,   -- view | enable_changes | change
  detail        text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_support_log_place on support_access_log (place_type, place_id, created_at desc);

-- Today's owners become owners of their places in the client dashboard.
insert into place_members (place_type, place_id, user_id, role, name)
select 'restaurant', u.restaurant_id, u.id, 'owner', trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, ''))
from users u where u.role = 'restaurant' and u.restaurant_id is not null
on conflict do nothing;

insert into place_members (place_type, place_id, user_id, role, name)
select 'coffeeshop', u.coffee_shop_id, u.id, 'owner', trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, ''))
from users u where u.role = 'coffeeshop' and u.coffee_shop_id is not null
on conflict do nothing;

insert into place_members (place_type, place_id, user_id, role, name)
select 'wedding', w.id, u.id, 'owner', trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, ''))
from wedding_venues w join users u on u.id::text = w.owner_user_id
on conflict do nothing;
