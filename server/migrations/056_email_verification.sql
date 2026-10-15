-- 056_email_verification.sql — confirming email sign-ups and resetting a
-- forgotten password with a 6-digit code sent by email.
-- Accounts that existed before this are treated as confirmed, so nobody is
-- suddenly locked out; Google sign-ins are confirmed by Google.
alter table users add column if not exists email_verified boolean not null default false;
update users set email_verified = true where created_at < now();

create table if not exists email_codes (
  id          bigserial primary key,
  user_id     uuid not null references users(id) on delete cascade,
  purpose     text not null check (purpose in ('verify', 'reset')),
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_email_codes_user on email_codes (user_id, purpose, created_at desc);
