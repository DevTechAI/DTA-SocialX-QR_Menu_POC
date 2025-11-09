-- ============================================
-- UPDATE MENU ITEMS: Description and Pricing
-- ============================================
-- This script updates:
-- 1. Nachos Bowl description (remove "cheese and toppings")
-- 2. Chicken Nuggets Classic price (119 → 139)
-- 3. Chicken Nuggets SocialX Signature price (159 → 169)
--
-- ⚠️ Run this in Supabase SQL Editor

-- ============================================
-- 1. Update Nachos Bowl Description
-- ============================================
UPDATE menu_items 
SET description = 'Crispy nachos',
    updated_at = NOW()
WHERE id = 'snack-nachos-bowl';

-- ============================================
-- 2. Update Chicken Nuggets Classic Price
-- ============================================
UPDATE menu_items 
SET price = 139,
    updated_at = NOW()
WHERE id = 'snack-chicken-nuggets-classic';

-- ============================================
-- 3. Update Chicken Nuggets SocialX Signature Price
-- ============================================
UPDATE menu_items 
SET price = 169,
    updated_at = NOW()
WHERE id = 'snack-chicken-nuggets-signature';

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify the updates:
-- SELECT id, name, description, price 
-- FROM menu_items 
-- WHERE id IN ('snack-nachos-bowl', 'snack-chicken-nuggets-classic', 'snack-chicken-nuggets-signature');

-- Expected results:
-- snack-nachos-bowl: description = 'Crispy nachos', price = 90
-- snack-chicken-nuggets-classic: price = 139
-- snack-chicken-nuggets-signature: price = 169

