/**
 * foodKeywords.js — the common foods people order, for the filter chips on
 * the Order Food page. A dish matches a food when one of its words appears
 * in the dish's name, category or description. Which chips show (and in
 * what order) is decided by the real menus and orders — see useFoodCatalog.
 */
export const FOODS = [
  { key: 'burger', label: 'Burgers', emoji: '🍔', terms: ['burger'] },
  { key: 'pizza', label: 'Pizza', emoji: '🍕', terms: ['pizza', 'calzone'] },
  { key: 'brochette', label: 'Brochettes', emoji: '🍢', terms: ['brochette', 'skewer', 'kebab', 'nyama choma'] },
  { key: 'chicken', label: 'Chicken', emoji: '🍗', terms: ['chicken', 'wings'] },
  { key: 'chips', label: 'Chips & fries', emoji: '🍟', terms: ['chips', 'fries'] },
  { key: 'rice', label: 'Rice & stews', emoji: '🍛', terms: ['rice', 'pilau', 'biryani', 'curry', 'stew'] },
  { key: 'rwandan', label: 'Rwandan', emoji: '🥘', terms: ['isombe', 'matoke', 'ugali', 'ibihaza', 'goat', 'tilapia', 'beans'] },
  { key: 'pasta', label: 'Pasta', emoji: '🍝', terms: ['pasta', 'spaghetti', 'lasagna', 'ravioli', 'penne'] },
  { key: 'fish', label: 'Fish', emoji: '🐟', terms: ['fish', 'tilapia', 'seafood', 'prawn', 'sushi'] },
  { key: 'salad', label: 'Salads', emoji: '🥗', terms: ['salad', 'healthy', 'bowl'] },
  { key: 'sandwich', label: 'Sandwiches', emoji: '🥪', terms: ['sandwich', 'wrap', 'panini', 'toast'] },
  { key: 'coffee', label: 'Coffee', emoji: '☕', terms: ['coffee', 'cappuccino', 'latte', 'espresso', 'americano', 'macchiato'] },
  { key: 'juice', label: 'Juices & shakes', emoji: '🥤', terms: ['juice', 'smoothie', 'milkshake', 'shake', 'lemonade'] },
  { key: 'dessert', label: 'Desserts', emoji: '🍰', terms: ['cake', 'dessert', 'ice cream', 'croissant', 'pastry', 'muffin', 'cookie'] },
];

export const dishText = (d) => `${d.name} ${d.category} ${d.description}`.toLowerCase();
export const matchesFood = (dish, food) => food.terms.some((t) => dishText(dish).includes(t));
