-- Adds the profile fields a real customer/seller account needs.
-- `role` stays exactly as it was: null for an ordinary account, one of
-- 'news' | 'sellers' | 'director' for an admin. A customer/seller sign-up
-- never sets it — there's still no way to self-grant an admin role.
alter table users add column if not exists first_name text;
alter table users add column if not exists last_name text;
alter table users add column if not exists phone text;
