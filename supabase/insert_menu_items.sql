-- ============================================
-- INSERT MENU ITEMS
-- ============================================
-- This script clears all existing menu items and inserts new ones
-- Execute this in Supabase SQL Editor
-- 
-- ⚠️ WARNING: This will DELETE all existing menu items before inserting new ones!

-- ============================================
-- CLEAR EXISTING MENU ITEMS
-- ============================================
-- Delete all existing menu items to start fresh
DELETE FROM menu_items;

-- Alternative: If you want to keep some items, you can comment out the DELETE above
-- and use UPDATE instead with ON CONFLICT (which is already in the INSERT statements below)

-- ============================================
-- COLD COFFEE ITEMS
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('cold-coffee', 'Cold Coffee', 'Blended coffee, milk, sweet, ice, mostly sweet and rich', 219, 'COLD', true, '🧊'),
  ('cold-cranberry-espresso', 'Cranberry Iced Espresso', 'Espresso with cranberry, juicy and intense', 219, 'COLD', true, '🫐'),
  ('cold-iced-americano', 'Iced Americano', 'Espresso + ice, cold water, pure and raw and cold', 190, 'COLD', true, '🧋'),
  ('cold-iced-mocha', 'Iced Mocha', 'Chilled mocha, chocolate + cold milk + ice', 219, 'COLD', true, '🍨'),
  ('cold-iced-vietnamese', 'Iced Vietnamese', 'Espresso + condensed milk + ice, bold, sweet, and intense', 219, 'COLD', true, '🥤'),
  ('cold-cola-espresso', 'Cola Iced Espresso', 'Espresso with cola, refreshing and energizing', 249, 'COLD', true, '🥤'),
  ('cold-redbull-espresso', 'Redbull Iced Espresso', 'Espresso with Redbull, intense energy boost', 349, 'COLD', true, '⚡')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- NON-COFFEE & REFRESHERS ITEMS
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('nc-hot-chocolate', 'Hot Chocolate', 'Velvety chocolate + milk, not too sweet, not too dark, balanced', 249, 'NON-COFFEE', true, '🍫'),
  ('nc-classic-iced-coke', 'Classic Iced Coke', 'Coke + ice, fizzy and refreshing', 79, 'NON-COFFEE', true, '🥤'),
  ('nc-diet-iced-coke', 'Diet Iced Coke', 'Diet coke + ice, fizzy and refreshing, zero calories', 79, 'NON-COFFEE', true, '🥤'),
  ('nc-redbull-chilled', 'Redbull Chilled', 'Chilled redbull + ice, No caption needed', 170, 'NON-COFFEE', true, '⚡'),
  ('nc-lemonade', 'Lemonade', 'Fresh lemonade, sweet and tangy', 70, 'NON-COFFEE', true, '🍋'),
  ('nc-butter-milk', 'Butter Milk', 'Traditional buttermilk, refreshing and creamy', 80, 'NON-COFFEE', true, '🥛')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- SNACKS & BITES ITEMS
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('snack-nachos-bowl', 'Nachos Bowl', 'Crispy nachos with cheese and toppings', 90, 'NON-COFFEE', true, '🌮'),
  ('snack-potato-wedges', 'Potato Wedges', 'Crispy potato wedges, perfectly seasoned', 139, 'NON-COFFEE', true, '🍟'),
  ('snack-potato-wedges-signature', 'Potato Wedges SocialX Signature', 'Our special signature potato wedges with unique seasoning', 169, 'NON-COFFEE', true, '🍟'),
  ('snack-garlic-chilli-pops', 'Garlic Chilli Pops', 'Spicy garlic chilli pops, crispy and flavorful', 119, 'NON-COFFEE', true, '🌶️'),
  ('snack-garlic-chilli-pops-signature', 'Garlic Chilli Pops SocialX Signature', 'Our special signature garlic chilli pops with unique twist', 149, 'NON-COFFEE', true, '🌶️'),
  ('snack-french-fries', 'French Fries', 'Classic crispy french fries', 129, 'NON-COFFEE', true, '🍟'),
  ('snack-french-fries-signature', 'French Fries SocialX Signature', 'Our special signature french fries with unique seasoning', 159, 'NON-COFFEE', true, '🍟'),
  ('snack-chicken-nuggets-classic', 'Chicken Nuggets Classic', 'Classic crispy chicken nuggets', 119, 'NON-COFFEE', true, '🍗'),
  ('snack-chicken-nuggets-signature', 'Chicken Nuggets SocialX Signature', 'Our special signature chicken nuggets with unique flavor', 159, 'NON-COFFEE', true, '🍗')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- DESSERTS ITEMS
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('dessert-hot-brownie', 'Hot Brownie', 'Warm chocolate brownie, gooey and delicious', 199, 'NON-COFFEE', true, '🍫'),
  ('dessert-choco-lava', 'Choco Lava', 'Chocolate lava cake, molten center, decadent', 119, 'NON-COFFEE', true, '🍰')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- NOTES
-- ============================================
-- Coffee Addons (Hazelnut +30, Oat milk +40, Almond milk +40) are not included
-- as they are add-ons/modifiers, not standalone menu items.
-- You may want to create a separate table for addons in the future.

-- All items are set to available = true by default
-- Prices are in the currency unit (assumed to be the same as existing items)
-- Categories used: 'COLD' and 'NON-COFFEE'
-- Icons are emoji representations for visual display

