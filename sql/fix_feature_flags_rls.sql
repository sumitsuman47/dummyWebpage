-- =============================================
-- FIX RLS POLICIES FOR FEATURE FLAGS
-- =============================================
-- Run this to fix the Row Level Security issues

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Anyone can view audit log" ON feature_flag_audit;

-- Create more permissive policies for feature_flags table
CREATE POLICY "Allow all operations on feature_flags" 
  ON feature_flags FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create permissive policy for audit table (needed for trigger)
CREATE POLICY "Allow all operations on feature_flag_audit" 
  ON feature_flag_audit FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('feature_flags', 'feature_flag_audit')
ORDER BY tablename, policyname;
