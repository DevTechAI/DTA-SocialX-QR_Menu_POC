-- ============================================
-- INSERT ALL MENU ITEMS (COMPLETE)
-- ============================================
-- This script clears all existing menu items and inserts ALL menu items
-- Execute this in Supabase SQL Editor
-- 
-- ⚠️ IMPORTANT: If you already have the menu_items table created, you MUST run
--    UPDATE_CATEGORIES_MIGRATION.sql FIRST to add support for the new categories
--    (ADDON, SNACK, DESSERT) before running this script!
-- 
-- ⚠️ WARNING: This will DELETE all existing menu items before inserting new ones!

-- ============================================
-- CLEAR EXISTING MENU ITEMS
-- ============================================
-- Delete all existing menu items to start fresh
DELETE FROM menu_items;

-- ============================================
-- HOT COFFEE ITEMS
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('hot-latte', 'Latte', 'Espresso + more milk, less coffee more milk', 219, 'HOT', true, '☕'),
  ('hot-cappuccino', 'Cappuccino', 'Espresso + less foam, stronger than latte', 239, 'HOT', true, '🥤'),
  ('hot-mocha', 'Mocha', 'Espresso + homemade chocolate + milk, our recommendation', 259, 'HOT', true, '🍫'),
  ('hot-americano', 'Americano', 'Espresso + hot water, pure and raw', 190, 'HOT', true, '☕'),
  ('hot-vietnamese', 'Vietnamese Coffee', 'Espresso + condensed milk, bold, sweet, and intense', 219, 'HOT', true, '🍵')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

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
-- COFFEE ADDONS [TAB]
-- ============================================
-- Note: These are add-ons/modifiers that can be added to coffee items
-- They are included as separate menu items for ordering flexibility
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('addon-hazelnut', 'Hazelnut', 'Hazelnut flavor add-on for coffee', 30, 'ADDON', true, '🌰'),
  ('addon-oat-milk', 'Oat Milk', 'Oat milk substitute add-on', 40, 'ADDON', true, '🌾'),
  ('addon-almond-milk', 'Almond Milk', 'Almond milk substitute add-on', 40, 'ADDON', true, '🥜')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- SNACKS & BITES [TAB]
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('snack-nachos-bowl', 'Nachos Bowl', 'Crispy nachos with cheese and toppings', 90, 'SNACK', true, '🌮'),
  ('snack-potato-wedges', 'Potato Wedges', 'Crispy potato wedges, perfectly seasoned', 139, 'SNACK', true, '🍟'),
  ('snack-potato-wedges-signature', 'Potato Wedges SocialX Signature', 'Our special signature potato wedges with unique seasoning', 169, 'SNACK', true, '🍟'),
  ('snack-garlic-chilli-pops', 'Garlic Chilli Pops', 'Spicy garlic chilli pops, crispy and flavorful', 119, 'SNACK', true, '🌶️'),
  ('snack-garlic-chilli-pops-signature', 'Garlic Chilli Pops SocialX Signature', 'Our special signature garlic chilli pops with unique twist', 149, 'SNACK', true, '🌶️'),
  ('snack-french-fries', 'French Fries', 'Classic crispy french fries', 129, 'SNACK', true, '🍟'),
  ('snack-french-fries-signature', 'French Fries SocialX Signature', 'Our special signature french fries with unique seasoning', 159, 'SNACK', true, '🍟'),
  ('snack-chicken-nuggets-classic', 'Chicken Nuggets Classic', 'Classic crispy chicken nuggets', 119, 'SNACK', true, '🍗'),
  ('snack-chicken-nuggets-signature', 'Chicken Nuggets SocialX Signature', 'Our special signature chicken nuggets with unique flavor', 159, 'SNACK', true, '🍗')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- DESSERTS [TAB]
-- ============================================
INSERT INTO menu_items (id, name, description, price, category, available, icon) VALUES
  ('dessert-hot-brownie', 'Hot Brownie', 'Warm chocolate brownie, gooey and delicious', 199, 'DESSERT', true, '🍫'),
  ('dessert-choco-lava', 'Choco Lava', 'Chocolate lava cake, molten center, decadent', 119, 'DESSERT', true, '🍰')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- ============================================
-- SUMMARY
-- ============================================
-- Total Items: 32 menu items
--   - HOT Coffee: 5 items
--   - COLD Coffee: 7 items
--   - NON-COFFEE: 6 items (refreshers)
--   - ADDON: 3 items (coffee addons)
--   - SNACK: 9 items (snacks & bites)
--   - DESSERT: 2 items (desserts)
--
-- Categories used: 'HOT', 'COLD', 'NON-COFFEE', 'ADDON', 'SNACK', 'DESSERT'
-- All items are set to available = true by default
-- Prices match the provided list exactly
-- Icons are emoji representations for visual display
--
-- Note: All categories match the menu tabs:
--   - Hot coffee [TAB] → 'HOT'
--   - Cold Coffee [TAB] → 'COLD'
--   - Non-Coffee & Refreshers [TAB] → 'NON-COFFEE'
--   - Coffee Addons [TAB] → 'ADDON'
--   - Snacks & Bites [TAB] → 'SNACK'
--   - Desserts [TAB] → 'DESSERT'

