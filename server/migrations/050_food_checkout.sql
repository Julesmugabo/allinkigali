-- One checkout can now order from several places: each place still gets its
-- own food_orders row (its own dashboard, status and delivery fee), and the
-- rows share a checkout_id so the customer follows them on one status page.
alter table food_orders add column if not exists checkout_id text;
alter table food_orders add column if not exists landmark text;
create index if not exists idx_food_orders_checkout on food_orders (checkout_id);
