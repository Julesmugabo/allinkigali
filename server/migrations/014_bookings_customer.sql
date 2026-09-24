-- Who made a service request, so a signed-in customer can see their own.
-- Null for requests made while signed out (or before this existed).
alter table bookings add column if not exists customer_id uuid references users(id) on delete set null;
