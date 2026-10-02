-- 018_property_listings.sql — Inzu Zamacye (rent) + House for Sale (sale)
create table if not exists property_listings (
  id            text        primary key default 'prop_' || gen_random_uuid()::text,
  listing_type  text        not null,              -- 'rent' | 'sale'
  title         text        not null,
  description   text,
  bedrooms      integer     not null default 1,
  bathrooms     integer     not null default 1,
  size_sqm      integer     not null default 0,
  price         bigint      not null,
  province      text        not null,
  district      text        not null,
  sector        text        not null,
  phone         text,
  pinned        boolean     not null default false,
  rented_sold   boolean     not null default false,  -- true = rented out / sold
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists prop_listings_type_idx     on property_listings (listing_type);
create index if not exists prop_listings_province_idx on property_listings (province);
create index if not exists prop_listings_district_idx on property_listings (district);
create index if not exists prop_listings_status_idx   on property_listings (rented_sold);
