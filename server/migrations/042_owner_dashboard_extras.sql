-- 042_owner_dashboard_extras.sql
-- Adds columns needed by the restaurant + coffee shop owner dashboards.

-- Coffee shop menu: brew method, origin, available flag
ALTER TABLE coffee_shop_menu_items
  ADD COLUMN IF NOT EXISTS brew_method  TEXT,
  ADD COLUMN IF NOT EXISTS origin       TEXT,
  ADD COLUMN IF NOT EXISTS available    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- Coffee shop busy-now status (auto-expires on client side after 2h)
ALTER TABLE coffee_shops
  ADD COLUMN IF NOT EXISTS busy_now        TEXT CHECK (busy_now IN ('quiet','moderate','full')),
  ADD COLUMN IF NOT EXISTS busy_updated_at TIMESTAMPTZ;

-- Reviews table: owner reply + place_type for restaurant/coffee_shop scoping
-- Create the reviews table if it doesn't already exist
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id     TEXT        NOT NULL,
  place_type   TEXT        NOT NULL,  -- 'restaurant' | 'coffee_shop'
  user_id      TEXT,
  rating       NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text         TEXT,
  owner_reply  TEXT,
  reply_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id, place_type);

-- Resto orders table for restaurant/coffee shop delivery+takeaway pipeline
CREATE TABLE IF NOT EXISTS resto_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id       TEXT         NOT NULL,
  place_type     TEXT         NOT NULL,  -- 'restaurant' | 'coffee_shop'
  code           TEXT,
  status         TEXT         NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','accepted','preparing','ready','delivered','cancelled')),
  items          JSONB        NOT NULL DEFAULT '[]',
  total          INTEGER      NOT NULL DEFAULT 0,
  customer_phone TEXT,
  address        TEXT,
  prep_minutes   INTEGER,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resto_orders_place ON resto_orders(place_id, place_type, status);
