-- ============================================
-- ADD show_image COLUMN TO menu_items TABLE
-- ============================================
-- This script adds a boolean column to control whether to show
-- the image or emoji icon for each menu item in the customer-facing menu
-- Execute this in Supabase SQL Editor
-- ============================================

-- Add show_image column (defaults to false - show emoji by default)
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS show_image BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN menu_items.show_image IS 'If true, show image_url in customer menu. If false, show emoji icon.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS menu_items_show_image_idx ON menu_items(show_image);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the column was added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'menu_items' AND column_name = 'show_image';

