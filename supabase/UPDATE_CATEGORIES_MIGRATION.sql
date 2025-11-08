-- ============================================
-- MIGRATION: Update Menu Categories
-- ============================================
-- This script updates the menu_items table to support all 6 categories
-- Execute this BEFORE running insert_all_menu_items.sql
--
-- ⚠️ IMPORTANT: Run this in Supabase SQL Editor first!

-- ============================================
-- STEP 1: Drop the existing CHECK constraint
-- ============================================
ALTER TABLE menu_items 
DROP CONSTRAINT IF EXISTS menu_items_category_check;

-- ============================================
-- STEP 2: Add new CHECK constraint with all 6 categories
-- ============================================
ALTER TABLE menu_items 
ADD CONSTRAINT menu_items_category_check 
CHECK (category IN ('HOT', 'COLD', 'NON-COFFEE', 'ADDON', 'SNACK', 'DESSERT'));

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify the constraint:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'menu_items'::regclass 
-- AND conname = 'menu_items_category_check';

-- Expected output should show all 6 categories in the CHECK constraint

