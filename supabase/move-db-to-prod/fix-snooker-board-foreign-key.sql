-- ============================================
-- FIX SNOOKER BOARD FOREIGN KEY CONSTRAINT
-- ============================================
-- This script fixes the foreign key constraint in snooker_booking_orders
-- to reference the correct column name (snooker_board_id instead of snooker_board_item_id)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the existing foreign key constraint
-- First, find the constraint name
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'snooker_booking_orders'::regclass
    AND contype = 'f'
    AND confrelid = 'snooker_board_menu_items'::regclass;
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE snooker_booking_orders DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found';
    END IF;
END $$;

-- Step 2: Add the new foreign key constraint with the correct column name
ALTER TABLE snooker_booking_orders
ADD CONSTRAINT snooker_orders_board_fk
FOREIGN KEY (snooker_board_id)
REFERENCES snooker_board_menu_items(snooker_board_id)
ON DELETE RESTRICT;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify:
-- 1. The constraint was created successfully
-- 2. Try creating/updating a snooker booking
-- 3. It should work without errors
-- 
-- To verify the constraint:
-- SELECT 
--     conname AS constraint_name,
--     pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'snooker_booking_orders'::regclass
-- AND conname = 'snooker_orders_board_fk';
-- ============================================

