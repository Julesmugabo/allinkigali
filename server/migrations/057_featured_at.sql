-- When a writer made an article the main story. The main story is always a
-- writer's choice: if the current one is archived or un-featured, the
-- previous choice comes back instead of whatever is newest.
alter table news_articles add column if not exists featured_at timestamptz;
update news_articles set featured_at = now() where is_featured and featured_at is null;
