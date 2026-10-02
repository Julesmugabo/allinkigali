-- 020_listing_photos.sql — add photos[] to land and property listings
-- Each entry: { url: string, label: string, isVideo?: boolean }
alter table land_listings
  add column if not exists photos jsonb not null default '[]'::jsonb;

alter table property_listings
  add column if not exists photos jsonb not null default '[]'::jsonb;
