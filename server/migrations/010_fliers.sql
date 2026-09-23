create table if not exists fliers (
  id uuid primary key default gen_random_uuid(),
  image_uri text,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now()
);
