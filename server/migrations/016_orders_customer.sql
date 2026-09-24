-- Who placed an order, so a signed-in customer can see their own.
-- Null for orders placed while signed out.
alter table orders add column if not exists customer_id uuid references users(id) on delete set null;
