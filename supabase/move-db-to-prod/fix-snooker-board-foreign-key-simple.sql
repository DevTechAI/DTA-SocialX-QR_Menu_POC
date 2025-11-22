-- ============================================
-- FIX SNOOKER BOARD FOREIGN KEY CONSTRAINT (SIMPLE VERSION)
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Find and drop the existing foreign key constraint
ALTER TABLE snooker_booking_orders 
DROP CONSTRAINT IF EXISTS snooker_booking_orders_snooker_board_id_fkey;

-- If the above doesn't work, try finding the constraint name first:
-- SELECT conname 
-- FROM pg_constraint 
-- WHERE conrelid = 'snooker_booking_orders'::regclass 
-- AND contype = 'f';

-- Step 2: Add the new foreign key constraint with the correct column name
ALTER TABLE snooker_booking_orders
ADD CONSTRAINT snooker_booking_orders_snooker_board_id_fkey
FOREIGN KEY (snooker_board_id)
REFERENCES snooker_board_menu_items(snooker_board_id)
ON DELETE RESTRICT;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify the constraint was created:
-- SELECT 
--     conname AS constraint_name,
--     pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'snooker_booking_orders'::regclass
-- AND conname = 'snooker_booking_orders_snooker_board_id_fkey';
-- ============================================

