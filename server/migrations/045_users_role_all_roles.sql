-- The original users.role check (002) only allowed news / sellers / director,
-- so assigning any role added later (finance, restaurant, coffeeshop, the
-- real-estate and shop roles) failed with a constraint error. Allow every
-- role the server actually checks for (see requireRole and admin.js ASSIGNABLE).
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in (
  'director', 'news', 'sellers', 'finance',
  'restaurant', 'coffeeshop',
  'ibibanza', 'inzuzamacye', 'salehouse', 'allingadget', 'uruhurwiza'
));
