-- Fields the owner dashboard collects but had nowhere to store.
alter table restaurants  add column if not exists open_hours text;
alter table restaurants  add column if not exists delivery_zones text;
alter table coffee_shops add column if not exists open_hours text;
alter table coffee_shops add column if not exists delivery_zones text;

-- Why a booking was declined (shown to the guest), and when the place first
-- answered (confirm or decline) — used for the owner's response-rate insight.
alter table resto_bookings add column if not exists decline_reason text;
alter table resto_bookings add column if not exists responded_at timestamptz;
