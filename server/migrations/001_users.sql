-- 001_users.sql
-- Replaces Supabase's auth.users + admin_roles with one real table we own
-- directly. `role` is null for an ordinary customer account; for an admin
-- it's 'news' | 'sellers' | 'director' — same three roles as before, same
-- meaning (which dashboard they can open).
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text check (role in ('news', 'sellers', 'director')),
  created_at timestamptz not null default now()
);
