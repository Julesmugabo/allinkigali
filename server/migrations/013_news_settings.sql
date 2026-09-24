-- One row of site-wide News settings the news admin controls.
-- show_view_counts: whether readers see how many people read each article
-- (the admin dashboard always sees counts regardless).
create table if not exists news_settings (
  id boolean primary key default true check (id),
  show_view_counts boolean not null default true
);

insert into news_settings (id) values (true) on conflict (id) do nothing;
