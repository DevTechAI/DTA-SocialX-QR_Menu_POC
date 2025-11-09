-- ============================================
-- MIGRATION: Add customer_phNo to orders table
-- ============================================
-- This script adds the customer_phNo column to the orders table
-- Execute this in Supabase SQL Editor
--
-- ⚠️ IMPORTANT: Run this BEFORE creating new orders with phone numbers!

-- ============================================
-- STEP 1: Add customer_phNo column (nullable first for existing data)
-- ============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phNo TEXT;

-- ============================================
-- STEP 2: Update existing orders with placeholder phone numbers
-- ============================================
-- Set a default placeholder for existing orders that don't have phone numbers
UPDATE orders 
SET customer_phNo = 'N/A' 
WHERE customer_phNo IS NULL;

-- ============================================
-- STEP 3: Make the column NOT NULL
-- ============================================
-- After updating existing records, make the column required
ALTER TABLE orders 
ALTER COLUMN customer_phNo SET NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify the column was added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'customer_phNo';

-- Expected output:
-- column_name: customer_phNo
-- data_type: text
-- is_nullable: NO

