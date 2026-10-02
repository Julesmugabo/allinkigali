-- 017_land_listings.sql — Ibibanza: land plots for sale
create table if not exists land_listings (
  id            text        primary key default 'land_' || gen_random_uuid()::text,
  title         text        not null,
  description   text,
  type          text        not null default 'residential',  -- residential|commercial|agricultural|mixed
  size_sqm      integer     not null,
  price         bigint      not null,
  province      text        not null,
  district      text        not null,
  sector        text        not null,
  titled        boolean     not null default false,
  phone         text,
  pinned        boolean     not null default false,
  sold          boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists land_listings_province_idx on land_listings (province);
create index if not exists land_listings_district_idx on land_listings (district);
create index if not exists land_listings_sold_idx     on land_listings (sold);
