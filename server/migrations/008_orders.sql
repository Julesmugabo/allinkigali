create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  delivery_address text not null default '',
  phone text not null default '',
  note text not null default '',
  payment_method text,
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total numeric not null default 0,
  history jsonb not null default '[]',
  created_at timestamptz not null default now()
);
