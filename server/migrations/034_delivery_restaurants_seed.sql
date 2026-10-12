-- Migration 034: Seed 3 delivery-enabled restaurants + their menu items
-- Uses INSERT ... ON CONFLICT DO NOTHING so re-running is safe.

INSERT INTO restaurants (id, name, description, location, district, phone, cuisines, foods, occasion, price, atmosphere, dietary, seating, features, rating, open_status, delivery_enabled, delivery_fee, min_order, estimated_time)
VALUES
  ('del1', 'SipStack LTD',
   'Kibagabaga''s favourite all-day spot — specialty coffee, craft burgers, wood-fired pizza and breakfast plates, all available for delivery.',
   'Kibagabaga, Kigali', 'Gasabo', '0799 526 403',
   ARRAY['cafe','burgers','pizza','breakfast'],
   ARRAY['Burgers','Pizza','Breakfast','Coffee','Sandwiches','Salads','Fries'],
   ARRAY['friends','family','work'],
   2, ARRAY['casual','modern','cozy'],
   ARRAY['vegetarian'],
   ARRAY['standard','outdoor'],
   ARRAY['wifi','delivery'],
   4.5, 'Open now',
   true, 1000, 3000, '30-45 min'),

  ('del2', 'Gato Café',
   'KG 1 Avenue staple for fresh pastries, specialty coffee, sandwiches and light bites. Fast, friendly and always fresh.',
   'KG 1 Avenue, Kigali', 'Nyarugenge', '0792 116 352',
   ARRAY['cafe','sandwiches','pastries','coffee'],
   ARRAY['Coffee','Pastries','Sandwiches','Smoothies','Salads','Breakfast'],
   ARRAY['friends','work','quick'],
   1, ARRAY['casual','cozy','bright'],
   ARRAY['vegetarian','vegan'],
   ARRAY['standard','bar'],
   ARRAY['wifi','delivery'],
   4.4, 'Open now',
   true, 800, 2000, '20-35 min'),

  ('del3', 'Bob''s Kitchen',
   'Kigali''s go-to for juicy burgers, crispy chicken and loaded fries. Quick comfort food, ready when you are.',
   'Remera, Kigali', 'Gasabo', '0788 000 123',
   ARRAY['fastfood','burgers','chicken'],
   ARRAY['Burgers','Chicken','Fries','Wraps','Hot Dogs','Milkshakes'],
   ARRAY['friends','quick'],
   1, ARRAY['casual','lively'],
   ARRAY['halal'],
   ARRAY['standard','takeaway'],
   ARRAY['delivery'],
   4.2, 'Open now',
   true, 500, 2500, '25-40 min')
ON CONFLICT (id) DO NOTHING;

-- Seed menu items for SipStack LTD
INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, available)
VALUES
  ('del1', 'Breakfast', 'Big Breakfast Plate', 'Eggs, toast, sausage, beans and juice', 3500, true),
  ('del1', 'Breakfast', 'Pancake Stack', 'Three fluffy pancakes with maple syrup and butter', 2800, true),
  ('del1', 'Breakfast', 'Avocado Toast', 'Sourdough, smashed avocado, poached egg, chilli flakes', 3200, true),
  ('del1', 'Burgers', 'Classic Cheeseburger', 'Beef patty, cheddar, lettuce, tomato, pickles, special sauce', 4500, true),
  ('del1', 'Burgers', 'SipStack Double', 'Double smash patty, double cheese, caramelised onions, jalapeños', 5500, true),
  ('del1', 'Burgers', 'Crispy Chicken Burger', 'Fried chicken thigh, coleslaw, chipotle mayo, brioche bun', 4800, true),
  ('del1', 'Pizza', 'Margherita', 'San Marzano tomato, mozzarella, fresh basil', 6000, true),
  ('del1', 'Pizza', 'Pepperoni', 'Tomato sauce, mozzarella, generous pepperoni', 7000, true),
  ('del1', 'Pizza', 'BBQ Chicken', 'BBQ sauce, grilled chicken, red onion, mozzarella, coriander', 7500, true),
  ('del1', 'Coffee & Drinks', 'Filter Coffee', 'Single origin Rwandan filter, hot or iced', 1500, true),
  ('del1', 'Coffee & Drinks', 'Flat White', 'Double ristretto with steamed milk', 2000, true),
  ('del1', 'Coffee & Drinks', 'Fresh Juice', 'Passion fruit, mango or pineapple', 1800, true),
  ('del1', 'Sides', 'Fries', 'Crispy skin-on fries with ketchup', 1500, true),
  ('del1', 'Sides', 'Side Salad', 'Mixed greens, cherry tomatoes, balsamic dressing', 2000, true)
;

-- Seed menu items for Gato Café
INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, available)
VALUES
  ('del2', 'Coffee', 'Espresso', 'Single shot of Rwandan espresso', 1000, true),
  ('del2', 'Coffee', 'Cappuccino', 'Espresso with steamed and frothed milk', 1800, true),
  ('del2', 'Coffee', 'Iced Latte', 'Espresso over ice with cold milk, choice of syrup', 2200, true),
  ('del2', 'Coffee', 'Chai Latte', 'Spiced tea with steamed milk', 2000, true),
  ('del2', 'Pastries', 'Croissant', 'Buttery, flaky, freshly baked', 1500, true),
  ('del2', 'Pastries', 'Pain au Chocolat', 'Croissant dough with dark chocolate inside', 1800, true),
  ('del2', 'Pastries', 'Blueberry Muffin', 'Fresh blueberries baked into a light muffin', 1500, true),
  ('del2', 'Pastries', 'Banana Bread', 'Slice of moist banana bread, optionally toasted', 1800, true),
  ('del2', 'Sandwiches', 'Club Sandwich', 'Chicken, bacon, egg, lettuce, tomato, mayo on toasted bread', 4000, true),
  ('del2', 'Sandwiches', 'Tuna Melt', 'Tuna, cheddar, tomato, grilled on sourdough', 3800, true),
  ('del2', 'Sandwiches', 'Veggie Wrap', 'Hummus, roasted veggies, feta, greens in a flour wrap', 3500, true),
  ('del2', 'Smoothies', 'Mango Sunrise', 'Mango, orange, ginger, carrot', 2500, true),
  ('del2', 'Smoothies', 'Green Boost', 'Spinach, banana, pineapple, lime', 2800, true)
;

-- Seed menu items for Bob's Kitchen
INSERT INTO restaurant_menu_items (restaurant_id, category, name, description, price, available)
VALUES
  ('del3', 'Burgers', 'Classic Bob''s Burger', 'Quarter-pound beef, American cheese, ketchup, mustard, onion', 3500, true),
  ('del3', 'Burgers', 'Spicy Bob', 'Beef patty, pepper jack, jalapeños, sriracha mayo, brioche', 4000, true),
  ('del3', 'Burgers', 'Double Stack', 'Two beef patties, double cheese, special Bob''s sauce', 5000, true),
  ('del3', 'Chicken', 'Crispy Chicken Strips (4 pcs)', 'Buttermilk-marinated chicken, served with dipping sauce', 3500, true),
  ('del3', 'Chicken', 'Fried Chicken Meal', 'Two pieces fried chicken with fries and a drink', 4500, true),
  ('del3', 'Chicken', 'Chicken Wrap', 'Fried chicken, lettuce, tomato, garlic mayo in a tortilla', 3800, true),
  ('del3', 'Fries & Sides', 'Regular Fries', 'Golden crispy fries', 1000, true),
  ('del3', 'Fries & Sides', 'Loaded Fries', 'Fries topped with cheese sauce, bacon bits, jalapeños', 2500, true),
  ('del3', 'Fries & Sides', 'Onion Rings', 'Beer-battered onion rings, 6 pieces', 2000, true),
  ('del3', 'Hot Dogs', 'Classic Hot Dog', 'Beef frank in a toasted bun, ketchup and mustard', 2500, true),
  ('del3', 'Hot Dogs', 'Chilli Cheese Dog', 'Beef frank, chilli, cheddar, onions', 3000, true),
  ('del3', 'Drinks', 'Milkshake', 'Chocolate, vanilla or strawberry, thick and creamy', 2500, true),
  ('del3', 'Drinks', 'Soft Drink', 'Coke, Fanta, Sprite or water', 800, true)
;
