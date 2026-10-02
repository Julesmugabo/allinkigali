-- 019_products.sql — Allingadget + Uruhu Rwiza product catalogs
create table if not exists products (
  id            text        primary key default 'prod_' || gen_random_uuid()::text,
  store         text        not null,              -- 'allingadget' | 'uruhu-rwiza'
  category      text        not null,
  brand         text        not null default '',
  name          text        not null,
  description   text,
  price         bigint      not null,
  badge         text,                              -- 'best_seller' | 'new' | 'hot' | 'luxury' | null
  icon          text        not null default 'package-variant-closed',
  available     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_store_idx    on products (store);
create index if not exists products_category_idx on products (store, category);
create index if not exists products_available_idx on products (available);
