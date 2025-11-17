-- ============================================
-- FIX RLS POLICY FOR authorized_emails TABLE
-- ============================================
-- This allows authenticated and anon users to READ from authorized_emails
-- which is required for authorization checks in middleware and page components
-- ============================================

-- Drop existing policy if it exists (optional, won't error if doesn't exist)
DROP POLICY IF EXISTS "Users can read authorized_emails" ON authorized_emails;

-- Create new policy to allow reading authorized_emails
CREATE POLICY "Users can read authorized_emails" ON authorized_emails
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify the policy was created:
-- 1. Go to Supabase Dashboard → Table Editor → authorized_emails
-- 2. Click on "RLS Policies" tab
-- 3. You should see both policies:
--    - "Service role can manage authorized emails" (for writes)
--    - "Users can read authorized_emails" (for reads)
-- ============================================

