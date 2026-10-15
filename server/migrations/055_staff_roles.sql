-- 055_staff_roles.sql — one staff account, several Staff Portal dashboards.
-- users.role stays the main role; staff_roles holds the extra ones the
-- director ticked (e.g. News + Finance). Never 'director'.
alter table users add column if not exists staff_roles text[] not null default '{}';
