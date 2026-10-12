-- Migration 033: Add ref_id to notifications; add coffee_shop_id to users
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref_id TEXT DEFAULT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS coffee_shop_id TEXT REFERENCES coffee_shops(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_coffee_shop_id ON users(coffee_shop_id);
