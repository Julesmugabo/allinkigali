-- Migration 027: Bookings for restaurants and coffee shops
CREATE TABLE IF NOT EXISTS resto_bookings (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type         TEXT NOT NULL CHECK (type IN ('restaurant','coffee_shop')),
  place_id     TEXT NOT NULL,
  place_name   TEXT NOT NULL,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name   TEXT NOT NULL,
  guest_phone  TEXT NOT NULL,
  date         TEXT NOT NULL,
  time         TEXT NOT NULL,
  party_size   INTEGER NOT NULL DEFAULT 2,
  notes        TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','confirmed','rejected','cancelled','completed','noshow')),
  noshow_count INTEGER DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resto_bookings_place ON resto_bookings(place_id);
CREATE INDEX IF NOT EXISTS idx_resto_bookings_user  ON resto_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_resto_bookings_status ON resto_bookings(status);
