-- ============================================
-- FIX SNOOKER BOARD AVAILABILITY TRIGGER
-- ============================================
-- This script fixes the update_snooker_board_availability() function
-- to use the correct column name (snooker_board_id instead of snooker_board_item_id)
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_board_on_order_status_change ON snooker_booking_orders;

-- Recreate the function with the correct column name
CREATE OR REPLACE FUNCTION update_snooker_board_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to 'Started', mark board as unavailable
  IF NEW.order_status = 'Started' AND (OLD.order_status IS NULL OR OLD.order_status != 'Started') THEN
    UPDATE snooker_board_menu_items
    SET is_available_to_play = false,
        current_status = 'STARTED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_id = NEW.snooker_board_id;
  END IF;
  
  -- When order status changes to 'Ended', mark board as available
  IF NEW.order_status = 'Ended' AND OLD.order_status != 'Ended' THEN
    UPDATE snooker_board_menu_items
    SET is_available_to_play = true,
        current_status = 'ENDED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_id = NEW.snooker_board_id;
  END IF;
  
  -- Handle other status changes (Paused, Resumed, etc.)
  IF NEW.order_status = 'Paused' AND OLD.order_status != 'Paused' THEN
    UPDATE snooker_board_menu_items
    SET current_status = 'PAUSED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_id = NEW.snooker_board_id;
  END IF;
  
  IF NEW.order_status = 'Resumed' AND OLD.order_status != 'Resumed' THEN
    UPDATE snooker_board_menu_items
    SET current_status = 'RESUMED',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_id = NEW.snooker_board_id;
  END IF;
  
  -- When status changes to 'Received' or 'Accepted', reset board status
  IF NEW.order_status IN ('Received', 'Accepted') AND OLD.order_status NOT IN ('Received', 'Accepted') THEN
    UPDATE snooker_board_menu_items
    SET current_status = 'Yet-To-Begin',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE snooker_board_id = NEW.snooker_board_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_board_on_order_status_change
AFTER UPDATE OF order_status ON snooker_booking_orders
FOR EACH ROW 
WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
EXECUTE FUNCTION update_snooker_board_availability();

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify:
-- 1. The function was created successfully
-- 2. The trigger was created successfully
-- 3. Try updating a snooker booking status
-- 4. It should work without errors
-- 
-- To verify the function and trigger:
-- SELECT 
--     proname AS function_name,
--     pg_get_functiondef(oid) AS function_definition
-- FROM pg_proc
-- WHERE proname = 'update_snooker_board_availability';
--
-- SELECT 
--     tgname AS trigger_name,
--     tgrelid::regclass AS table_name,
--     tgenabled AS enabled
-- FROM pg_trigger
-- WHERE tgname = 'update_board_on_order_status_change';
-- ============================================

