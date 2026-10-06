-- Migration 023: Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  district     TEXT,
  phone        TEXT,
  website      TEXT,
  cuisines     TEXT[]  DEFAULT '{}',
  foods        TEXT[]  DEFAULT '{}',
  occasion     TEXT[]  DEFAULT '{}',
  price        INTEGER DEFAULT 2,
  atmosphere   TEXT[]  DEFAULT '{}',
  dietary      TEXT[]  DEFAULT '{}',
  seating      TEXT[]  DEFAULT '{}',
  features     TEXT[]  DEFAULT '{}',
  rating       NUMERIC(3,1) DEFAULT 4.0,
  lat          NUMERIC(10,7),
  lng          NUMERIC(10,7),
  open_status  TEXT    DEFAULT 'Open now',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_photos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  label         TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_photos_restaurant_id ON restaurant_photos(restaurant_id);
