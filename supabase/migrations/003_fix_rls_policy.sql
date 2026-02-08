-- ============================================
-- FIX: Update RLS Policies to Avoid Recursion
-- ============================================

-- The previous policies queried the 'users' table directly to check for the 'manager' role.
-- This caused an infinite recursion or RLS violation during INSERT/UPDATE operations.
-- The fix is to use the `is_manager()` function which is marked as SECURITY DEFINER.

-- 1. Ensure the helper function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  -- This runs with the privileges of the creator, bypassing RLS for this specific check
  RETURN (SELECT role FROM users WHERE id = auth.uid()) = 'manager';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old problematic policies
DROP POLICY IF EXISTS "Managers can add users" ON users;
DROP POLICY IF EXISTS "Managers can update users" ON users;
DROP POLICY IF EXISTS "Users visibility" ON users;

-- 3. Create NEW robust policies using the function

-- SELECT: Allow if manager OR reading own record
CREATE POLICY "Users visibility" ON users
  FOR SELECT USING (
    is_manager() OR 
    id = auth.uid()
  );

-- INSERT: Only managers can insert (now safe from recursion)
CREATE POLICY "Managers can add users" ON users
  FOR INSERT WITH CHECK (
    is_manager()
  );

-- UPDATE: Only managers can update (safe from recursion)
CREATE POLICY "Managers can update users" ON users
  FOR UPDATE USING (
    is_manager()
  );

-- DELETE: Only managers can delete (adding this just in case)
DROP POLICY IF EXISTS "Managers can delete users" ON users;
CREATE POLICY "Managers can delete users" ON users
  FOR DELETE USING (
    is_manager()
  );
