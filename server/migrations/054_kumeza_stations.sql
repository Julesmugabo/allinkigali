-- 054_kumeza_stations.sql — kitchen and bar each mark their part of an order
-- ready. An order with food and drinks becomes "ready" (waiter alerted to
-- collect) once every station on it has pressed Ready; until then the
-- stations that are done are listed here (e.g. drinks ready, food cooking).
alter table table_orders add column if not exists ready_stations text[] not null default '{}';
