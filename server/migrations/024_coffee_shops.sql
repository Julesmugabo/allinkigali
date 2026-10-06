-- Migration 024: Coffee shops table
CREATE TABLE IF NOT EXISTS coffee_shops (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  district        TEXT,
  phone           TEXT,
  website         TEXT,
  coffee_types    TEXT[]  DEFAULT '{}',
  brewing_methods TEXT[]  DEFAULT '{}',
  origins         TEXT[]  DEFAULT '{}',
  food            TEXT[]  DEFAULT '{}',
  atmosphere      TEXT[]  DEFAULT '{}',
  facilities      TEXT[]  DEFAULT '{}',
  seating         TEXT[]  DEFAULT '{}',
  attributes      TEXT[]  DEFAULT '{}',
  services        TEXT[]  DEFAULT '{}',
  price           INTEGER DEFAULT 2,
  rating          NUMERIC(3,1) DEFAULT 4.0,
  open_status     TEXT    DEFAULT 'Open now',
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coffee_shop_photos (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  coffee_shop_id TEXT NOT NULL REFERENCES coffee_shops(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  label          TEXT,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coffee_shop_photos_coffee_shop_id ON coffee_shop_photos(coffee_shop_id);
