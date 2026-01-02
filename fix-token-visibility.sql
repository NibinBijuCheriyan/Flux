-- ============================================
-- FIX: Token Visibility Policy
-- ============================================
-- This script updates the security rules to ensure Employees
-- can see/validate tokens created by their Manager.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Tokens visibility" ON tokens;

-- 2. Create the corrected policy
CREATE POLICY "Tokens visibility" ON tokens
  FOR SELECT USING (
    -- Rule 1: I can see tokens I generated
    generated_by = auth.uid() OR
    
    -- Rule 2: I can see tokens my employees generated (if I am a manager)
    generated_by IN (
      SELECT id FROM users WHERE added_by = auth.uid()
    ) OR

    -- Rule 3: I can see tokens my MANAGER generated (if I am an employee)
    generated_by = (
      SELECT added_by FROM users WHERE id = auth.uid()
    )
  );
