-- 001_admin_roles.sql
-- Replaces the plaintext three-shared-passwords gate (src/admin/adminAuth.js)
-- with real per-person accounts. Paste this whole file into Supabase's
-- SQL Editor (left sidebar) and run it once.

create table if not exists admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('news', 'sellers', 'director')),
  created_at timestamptz not null default now()
);

alter table admin_roles enable row level security;

-- A signed-in admin may read only their own role row — enough for the app
-- to decide which dashboard to open, nothing more.
create policy "admins can read their own role"
  on admin_roles for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy is defined on purpose: nobody can grant
-- themselves a role through the app. Roles are only ever assigned by you,
-- directly in the Supabase SQL Editor (see the INSERT template below).
