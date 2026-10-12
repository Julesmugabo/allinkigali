-- Migration 032: Food delivery orders
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS min_order INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS estimated_time TEXT DEFAULT '30-45 min';

ALTER TABLE coffee_shops ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE coffee_shops ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE coffee_shops ADD COLUMN IF NOT EXISTS min_order INTEGER DEFAULT 0;
ALTER TABLE coffee_shops ADD COLUMN IF NOT EXISTS estimated_time TEXT DEFAULT '20-35 min';

CREATE TABLE IF NOT EXISTS food_orders (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id        TEXT NOT NULL,
  place_name      TEXT NOT NULL,
  place_type      TEXT NOT NULL DEFAULT 'restaurant',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal        INTEGER NOT NULL DEFAULT 0,
  delivery_fee    INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  delivery_address TEXT NOT NULL DEFAULT '',
  delivery_phone  TEXT NOT NULL DEFAULT '',
  notes           TEXT DEFAULT '',
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_food_orders_user ON food_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_place ON food_orders(place_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_status ON food_orders(status);
