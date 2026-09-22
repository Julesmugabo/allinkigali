-- 002_news.sql
-- Same shape as the earlier Supabase version, minus RLS — authorization
-- for these now lives in Express middleware (see src/middleware/auth.js
-- and requireRole.js), checked in each route instead of at the database.

create table if not exists news_categories (
  key text primary key,
  label text not null
);

create table if not exists news_articles (
  id uuid primary key default gen_random_uuid(),
  category text references news_categories(key) on delete restrict,
  title text not null,
  source text,
  source_url text,
  body text not null default '',
  image_url text,
  icon text,
  is_breaking boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_archived boolean not null default false,
  views integer not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
