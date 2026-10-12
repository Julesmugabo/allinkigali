-- Migration 031: Pending restaurant/coffee shop listing applications
CREATE TABLE IF NOT EXISTS pending_listings (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type          TEXT NOT NULL CHECK (type IN ('restaurant','coffeeshop')),
  business_name TEXT NOT NULL,
  location      TEXT NOT NULL,
  district      TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  notes         TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  decline_reason TEXT DEFAULT '',
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_listing_id TEXT DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_listings_status ON pending_listings(status);
CREATE INDEX IF NOT EXISTS idx_pending_listings_user ON pending_listings(user_id);
