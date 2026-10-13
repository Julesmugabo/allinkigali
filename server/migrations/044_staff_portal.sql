-- Staff Portal tables: announcements, shared documents, contracts
-- All created_by = user.id of the director who created the record.

create table if not exists staff_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  -- null = visible to all staff; otherwise an array of role strings
  visible_to  text[],
  pinned      boolean not null default false,
  created_by  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists staff_documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  file_url     text not null,
  file_type    text,            -- e.g. 'pdf', 'doc', 'sheet', 'link'
  -- null = all staff; otherwise specific roles
  visible_to   text[],
  created_by   uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists staff_contracts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  title        text not null,
  description  text,
  file_url     text not null,
  valid_from   date,
  valid_until  date,
  signed_at    timestamptz,
  created_by   uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- Track which announcements each user has read (for unread badge)
create table if not exists staff_announcement_reads (
  user_id         uuid not null references users(id) on delete cascade,
  announcement_id uuid not null references staff_announcements(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create index if not exists idx_staff_contracts_user on staff_contracts(user_id);
create index if not exists idx_staff_docs_created on staff_documents(created_at desc);
create index if not exists idx_staff_ann_created on staff_announcements(created_at desc);
