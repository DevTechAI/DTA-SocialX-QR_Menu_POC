-- ============================================
-- ADD "accepted" STATUS TO ORDERS TABLE
-- ============================================
-- This migration adds "accepted" as a valid status option
-- Run this in Supabase SQL Editor before deploying to production
-- ============================================

-- Drop the existing CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new CHECK constraint with "accepted" status
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('received', 'accepted', 'delivered', 'paid', 'unpaid'));

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify:
-- 1. Go to Supabase Dashboard → Table Editor → orders
-- 2. Try updating an order status to "accepted"
-- 3. It should work without errors
-- 
-- To verify the constraint:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'orders'::regclass 
-- AND conname = 'orders_status_check';
-- ============================================

