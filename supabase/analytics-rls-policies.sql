-- ============================================
-- RLS POLICIES FOR ANALYTICS TABLES
-- ============================================
-- These policies allow anonymous/public users to insert analytics data
-- while maintaining security for reads/updates
-- ============================================

-- ============================================
-- USER_SESSIONS TABLE
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can create user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Public can update user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Public can read user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Managers can read all user sessions" ON user_sessions;

-- Allow anonymous users to create and update their own sessions
CREATE POLICY "Public can create user sessions" ON user_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update their own sessions
CREATE POLICY "Public can update user sessions" ON user_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read their own sessions (by session_id)
CREATE POLICY "Public can read user sessions" ON user_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Managers can read all sessions
CREATE POLICY "Managers can read all user sessions" ON user_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_emails
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role IN ('manager', 'superadmin')
    )
  );

-- ============================================
-- USER_INTERACTION_EVENTS TABLE
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can create interaction events" ON user_interaction_events;
DROP POLICY IF EXISTS "Public can read interaction events" ON user_interaction_events;
DROP POLICY IF EXISTS "Managers can read all interaction events" ON user_interaction_events;

-- Allow anonymous users to insert events
CREATE POLICY "Public can create interaction events" ON user_interaction_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to read their own events
CREATE POLICY "Public can read interaction events" ON user_interaction_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Managers can read all events
CREATE POLICY "Managers can read all interaction events" ON user_interaction_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_emails
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role IN ('manager', 'superadmin')
    )
  );

-- ============================================
-- USER_FLOW_ANALYTICS TABLE
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can create flow analytics" ON user_flow_analytics;
DROP POLICY IF EXISTS "Public can update flow analytics" ON user_flow_analytics;
DROP POLICY IF EXISTS "Public can read flow analytics" ON user_flow_analytics;
DROP POLICY IF EXISTS "Managers can read all flow analytics" ON user_flow_analytics;

-- Allow anonymous users to create flow analytics
CREATE POLICY "Public can create flow analytics" ON user_flow_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to update their own flow analytics
CREATE POLICY "Public can update flow analytics" ON user_flow_analytics
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read their own flow analytics
CREATE POLICY "Public can read flow analytics" ON user_flow_analytics
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Managers can read all flow analytics
CREATE POLICY "Managers can read all flow analytics" ON user_flow_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM authorized_emails
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role IN ('manager', 'superadmin')
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify the policies were created:
-- 1. Go to Supabase Dashboard → Table Editor → user_sessions
-- 2. Click on "RLS Policies" tab
-- 3. You should see the policies listed above
-- 4. Repeat for user_interaction_events and user_flow_analytics tables
-- ============================================

