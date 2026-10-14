-- Photos for the three demo delivery places (del1 SipStack, del2 Gato Café,
-- del3 Bob's Kitchen) and their dishes, which had none, so Order Food shows
-- real pictures. Free Unsplash photos (hotlinking is how Unsplash asks to be
-- used); each was checked to load and to show what it's attached to.
-- Only fills gaps: places that already have photos and dishes that already
-- have one are left alone, so owners' own uploads always win.

create or replace function pg_temp.u(id text) returns text language sql as
$$ select 'https://images.unsplash.com/photo-' || id || '?auto=format&fit=crop&w=1200&q=75' $$;

insert into restaurant_photos (restaurant_id, url, label, sort_order)
select p.rid, pg_temp.u(p.pid), p.label, p.ord
from (values
  ('del1', '1552566626-52f8b828add9', 'Dining room', 0),
  ('del1', '1594212699903-ec8a3eca50f5', 'Burgers', 1),
  ('del1', '1513104890138-7c749659a591', 'Pizza', 2),
  ('del1', '1504754524776-8f4f37790ca0', 'Breakfast', 3),
  ('del1', '1554118811-1e0d58224f24', 'Café', 4),
  ('del2', '1501339847302-ac426a4a7cbb', 'Café', 0),
  ('del2', '1517433670267-08bbd4be890f', 'Bakery counter', 1),
  ('del2', '1509042239860-f550ce710b93', 'Coffee', 2),
  ('del2', '1530610476181-d83430b64dcd', 'Croissants', 3),
  ('del2', '1622597467836-f3285f2131b8', 'Smoothies', 4),
  ('del3', '1517248135467-4c7edcad34c4', 'Dining room', 0),
  ('del3', '1561758033-d89a9ad46330', 'Burger & fries', 1),
  ('del3', '1626082927389-6cd097cdc6ec', 'Fried chicken', 2),
  ('del3', '1612392062631-94dd858cba88', 'Hot dogs', 3),
  ('del3', '1550547660-d9450f859349', 'Burgers', 4)
) as p(rid, pid, label, ord)
where exists (select 1 from restaurants r where r.id = p.rid)
  and not exists (select 1 from restaurant_photos x where x.restaurant_id = p.rid);

update restaurant_menu_items m set photo_url = pg_temp.u(d.pid)
from (values
  ('del1', 'Big Breakfast Plate', '1504754524776-8f4f37790ca0'),
  ('del1', 'Pancake Stack', '1484723091739-30a097e8f929'),
  ('del1', 'Avocado Toast', '1525351484163-7529414344d8'),
  ('del1', 'Classic Cheeseburger', '1534790566855-4cb788d389ec'),
  ('del1', 'SipStack Double', '1568901346375-23c9450c58cd'),
  ('del1', 'Crispy Chicken Burger', '1606755962773-d324e0a13086'),
  ('del1', 'Margherita', '1513104890138-7c749659a591'),
  ('del1', 'Pepperoni', '1585238342024-78d387f4a707'),
  ('del1', 'BBQ Chicken', '1565299624946-b28f40a0ae38'),
  ('del1', 'Filter Coffee', '1559496417-e7f25cb247f3'),
  ('del1', 'Flat White', '1541167760496-1628856ab772'),
  ('del1', 'Fresh Juice', '1600271886742-f049cd451bba'),
  ('del1', 'Fries', '1573080496219-bb080dd4f877'),
  ('del1', 'Side Salad', '1607532941433-304659e8198a'),
  ('del2', 'Espresso', '1559496417-e7f25cb247f3'),
  ('del2', 'Cappuccino', '1495474472287-4d71bcdd2085'),
  ('del2', 'Iced Latte', '1509042239860-f550ce710b93'),
  ('del2', 'Chai Latte', '1541167760496-1628856ab772'),
  ('del2', 'Croissant', '1555507036-ab1f4038808a'),
  ('del2', 'Pain au Chocolat', '1530610476181-d83430b64dcd'),
  ('del2', 'Club Sandwich', '1553909489-cd47e0907980'),
  ('del2', 'Tuna Melt', '1528735602780-2552fd46c7af'),
  ('del2', 'Mango Sunrise', '1600271886742-f049cd451bba'),
  ('del2', 'Green Boost', '1622597467836-f3285f2131b8'),
  ('del3', 'Classic Bob''s Burger', '1571091718767-18b5b1457add'),
  ('del3', 'Spicy Bob', '1550547660-d9450f859349'),
  ('del3', 'Double Stack', '1568901346375-23c9450c58cd'),
  ('del3', 'Crispy Chicken Strips (4 pcs)', '1562967914-608f82629710'),
  ('del3', 'Fried Chicken Meal', '1626082927389-6cd097cdc6ec'),
  ('del3', 'Regular Fries', '1573080496219-bb080dd4f877'),
  ('del3', 'Classic Hot Dog', '1612392062631-94dd858cba88'),
  ('del3', 'Chilli Cheese Dog', '1619740455993-9e612b1af08a'),
  ('del3', 'Milkshake', '1572490122747-3968b75cc699'),
  ('del3', 'Soft Drink', '1497534446932-c925b458314e')
) as d(rid, name, pid)
where m.restaurant_id = d.rid and m.name = d.name and m.photo_url is null;
