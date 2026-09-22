-- 006_businesses_owner_id_text.sql
-- businesses.owner_id was typed `uuid`, but UserContext (still local/fake —
-- customer auth isn't migrated yet) generates plain timestamp-based string
-- ids like "user-1790091528859", not real UUIDs. Postgres rejected those
-- inserts outright — worse, the rejection crashed the whole server (see the
-- express-async-errors fix alongside this migration). `text` accepts
-- either shape, so registration works today; swap back to a real `uuid`
-- foreign key once customer accounts are real `users` rows.
alter table businesses alter column owner_id type text;
