-- Ads split into two channels managed separately in the News dashboard:
--   app — shown in the app/phone feed (Bisomwa cyane cards 2 and 4, then
--         one after every 6 stories)
--   web — shown on the website (left/right of the news page, and under
--         "Bisomwa cyane" on an article page)
-- Every ad gets a name, an optional link, optional run dates, an on/off
-- switch and view/click counters for advertiser reports.
alter table ads add column if not exists channel text not null default 'app';
alter table ads add column if not exists title text;
alter table ads add column if not exists link_url text;
alter table ads add column if not exists starts_on date;
alter table ads add column if not exists ends_on date;
alter table ads add column if not exists is_active boolean not null default true;
alter table ads add column if not exists views integer not null default 0;
alter table ads add column if not exists clicks integer not null default 0;

alter table ads drop constraint if exists ads_channel_check;
alter table ads add constraint ads_channel_check check (channel in ('app', 'web'));

-- Ads are no longer pinned after one article.
alter table ads alter column after_article_id drop not null;

-- The web ad a writer picked for an article (null = rotate automatically).
alter table news_articles add column if not exists web_ad_id uuid references ads(id) on delete set null;
