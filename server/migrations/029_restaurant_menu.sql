-- Migration 029: Restaurant menu items
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category    TEXT NOT NULL DEFAULT 'Main',
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,
  available   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON restaurant_menu_items(restaurant_id);

-- Seed: 14th Avenue Wine Bar (r11) — from live website kn14th.com
INSERT INTO restaurant_menu_items (restaurant_id, category, name, price, sort_order) VALUES
  ('r11','Warm Starters','Tilapia fish croquettes',15000,1),
  ('r11','Warm Starters','Fresh tilapia pieces in batter',16000,2),
  ('r11','Warm Starters','Baked eggplant with mozzarella',16000,3),
  ('r11','Warm Starters','Calamari Fritti',22000,4),
  ('r11','Warm Starters','Gambas al Ajillo (sizzling prawns)',24000,5),
  ('r11','Salads','Cucumber, tomato, avocado & mango',15000,1),
  ('r11','Salads','Greek Salad',15000,2),
  ('r11','Salads','Pasta salad',14000,3),
  ('r11','Salads','Tuna-Stuffed Avocado',14000,4),
  ('r11','Salads','Chicken salad',20000,5),
  ('r11','Salads','Smoked salmon salad',22000,6),
  ('r11','Pasta','Arrabbiata',21000,1),
  ('r11','Pasta','Spaghetti Bolognese',25000,2),
  ('r11','Pasta','Carbonara',25000,3),
  ('r11','Pasta','Beef lasagna',25000,4),
  ('r11','Pasta','Penne with chicken & cream sauce',27000,5),
  ('r11','Pasta','Pan-Seared Atlantic Salmon Spaghetti',27000,6),
  ('r11','Pasta','Prawns with garlic butter linguine',28000,7),
  ('r11','Mains','Roasted eggplant',21000,1),
  ('r11','Mains','Mediterranean Chicken Thighs',25000,2),
  ('r11','Mains','Pork fillet',25000,3),
  ('r11','Mains','Tilapia fish fillet steak',25000,4),
  ('r11','Mains','Pan-Seared Salmon Fillet',38000,5),
  ('r11','Mains','Beef Fillet',40000,6),
  ('r11','Mains','Prawns on sizzling plate',70000,7),
  ('r11','Desserts','Churros',8000,1),
  ('r11','Desserts','Affogato',10000,2),
  ('r11','Desserts','Ice cream',12000,3),
  ('r11','Desserts','Chocolate brownie',15000,4),
  ('r11','Desserts','Tiramisu',20000,5),

-- Seed: Poivre Noir (r8) — from livinginkigali.com review
  ('r8','Starters','Salmon ceviche with orange and tamarind',7500,1),
  ('r8','Starters','Grilled goat cheese with poached apples',7000,2),
  ('r8','Starters','Mushroom parmesan crumble with truffle oil',6000,3),
  ('r8','Mains','Homemade ravioli',9000,1),
  ('r8','Mains','Pork fillet',11000,2),
  ('r8','Mains','Portobello risotto',12000,3),
  ('r8','Mains','Beef tenderloin',12000,4),
  ('r8','Desserts','Tiramisu',5500,1),
  ('r8','Desserts','Chocolate cake',5500,2),
  ('r8','Desserts','Le Café Gourmand (3 mini desserts + espresso)',7500,3),

-- Seed: Sakae Restaurant (r1) — from New Times review
  ('r1','Sushi & Sets','Sashimi & sushi set',15000,1),
  ('r1','Sushi & Sets','Sakae sushi set (8 pcs + 2 special rolls)',11500,2),
  ('r1','Sushi & Sets','Salmon sushi set',10500,3),
  ('r1','Sushi & Sets','Tuna & salmon sushi set',11000,4),
  ('r1','Sushi & Sets','Vegetable sushi set',9500,5),
  ('r1','Korean','Beef bulgogi',12000,1),
  ('r1','Korean','Bibimbap',10000,2),
  ('r1','Korean','Pajeon (Korean pancake)',8500,3),
  ('r1','Japanese','Chicken wings',6000,1),
  ('r1','Japanese','Prawns tempura',9000,2),
  ('r1','Japanese','Yakitori',8000,3);
