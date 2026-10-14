-- Wedding venues take visit requests through the same bookings table, but
-- the type check only allowed restaurants and coffee shops, so every
-- "Book a visit" failed.
alter table resto_bookings drop constraint if exists resto_bookings_type_check;
alter table resto_bookings add constraint resto_bookings_type_check
  check (type in ('restaurant', 'coffee_shop', 'wedding'));
