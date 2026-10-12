-- Migration 030: Link a user account to the restaurant they own
ALTER TABLE users ADD COLUMN IF NOT EXISTS restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
