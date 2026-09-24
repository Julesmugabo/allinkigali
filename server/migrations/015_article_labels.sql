-- Extra labels the news admin can put on an article (Exclusive, Opinion,
-- Sponsored, Editor's pick). "Breaking" and "Trending" keep their own
-- columns; this list is for the labels added later so a new one doesn't need
-- a new column. Allowed values are enforced in server/src/routes/news.js.
alter table news_articles add column if not exists labels text[] not null default '{}';
