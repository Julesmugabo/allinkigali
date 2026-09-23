-- A "story" groups a sequence of article updates about one ongoing event
-- (e.g. "Iran war") so readers can see the latest update with a way to
-- browse the previous ones. Purely an admin-curated grouping — an article
-- only ever belongs to a story if the news admin explicitly attaches it.
create table if not exists news_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);

alter table news_articles add column if not exists story_id uuid references news_stories(id) on delete set null;
