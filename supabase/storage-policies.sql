-- ============================================
-- SUPABASE STORAGE SETUP FOR MENU ITEM IMAGES
-- ============================================
-- 
-- IMPORTANT: Before running this script:
-- 1. Create the storage bucket named 'menu-images' in Supabase Dashboard
--    - Go to Storage → New bucket
--    - Name: menu-images
--    - Public bucket: ✅ Enable
--    - File size limit: 5 MB
--    - Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp,image/gif
--
-- 2. Then run this SQL script to set up the policies
-- ============================================

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Managers can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Managers can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete menu images" ON storage.objects;

-- ============================================
-- POLICY 1: Allow Public Read Access
-- ============================================
-- Anyone can view/download menu item images
CREATE POLICY "Public can view menu images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'menu-images'
);

-- ============================================
-- POLICY 2: Allow Authenticated Managers to Upload
-- ============================================
-- Only authenticated users can upload images
-- Note: You may want to add role checking here if you have role-based auth
CREATE POLICY "Managers can upload menu images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- POLICY 3: Allow Authenticated Managers to Update
-- ============================================
-- Authenticated users can update/replace existing images
CREATE POLICY "Managers can update menu images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- POLICY 4: Allow Authenticated Managers to Delete
-- ============================================
-- Authenticated users can delete images
CREATE POLICY "Managers can delete menu images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup:

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'menu-images';

-- Check all policies for menu-images bucket
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%menu images%';

-- ============================================
-- NOTES:
-- ============================================
-- 1. The bucket must be created manually via Supabase Dashboard or API
-- 2. Make sure the bucket is set to PUBLIC for public read access
-- 3. If you need stricter role-based access, modify the policies to check
--    the authorized_emails table or user metadata
-- 4. To test: Try uploading an image via the admin dashboard
-- ============================================

