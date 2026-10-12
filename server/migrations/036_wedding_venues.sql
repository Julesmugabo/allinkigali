-- Wedding venues table
CREATE TABLE IF NOT EXISTS wedding_venues (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  location      TEXT NOT NULL DEFAULT '',
  district      TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  capacity      INTEGER NOT NULL DEFAULT 0,
  price         INTEGER NOT NULL DEFAULT 2,
  rating        NUMERIC(3,1) NOT NULL DEFAULT 4.5,
  facilities    TEXT[] NOT NULL DEFAULT '{}',
  views         TEXT[] NOT NULL DEFAULT '{}',
  privacy       TEXT[] NOT NULL DEFAULT '{}',
  photography   TEXT[] NOT NULL DEFAULT '{}',
  photos        JSONB NOT NULL DEFAULT '[]',
  open_status   TEXT NOT NULL DEFAULT 'Active',
  owner_user_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
