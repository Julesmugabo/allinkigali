-- Add photo URL to restaurant menu items
ALTER TABLE restaurant_menu_items ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Coffee shop menu items table
CREATE TABLE IF NOT EXISTS coffee_shop_menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coffee_shop_id TEXT NOT NULL REFERENCES coffee_shops(id) ON DELETE CASCADE,
  category      TEXT NOT NULL DEFAULT 'Drinks',
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL DEFAULT 0,
  photo_url     TEXT,
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
