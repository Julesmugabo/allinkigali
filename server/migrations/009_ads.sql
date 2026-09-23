create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'photo' check (type in ('photo', 'video')),
  media_uri text,
  after_article_id uuid references news_articles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists ads_after_article_id_key on ads (after_article_id);
