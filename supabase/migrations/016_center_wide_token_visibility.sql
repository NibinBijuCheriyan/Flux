-- ============================================
-- Migration 016: Center-Wide Token Visibility
-- ============================================
-- Makes ALL tokens within a center visible and usable by
-- EVERY employee in that center, not just the person who
-- generated them.
--
-- Before: Employees could only see tokens they generated.
-- After:  Any employee in the center can see and use any
--         active token in their center.
-- ============================================

-- 1. Drop existing token policies
DROP POLICY IF EXISTS "Tokens visibility" ON tokens;
DROP POLICY IF EXISTS "Token updates" ON tokens;

-- 2. New SELECT policy: center-wide visibility
-- Everyone in the same center can see all tokens in that center.
-- Also allows seeing own tokens even if center_id is null (legacy).
CREATE POLICY "Tokens visibility" ON tokens
  FOR SELECT USING (
    -- Rule 1: I can always see tokens I generated
    generated_by = auth.uid()
    OR (
      -- Rule 2: I can see all tokens in my center
      center_id IS NOT NULL
      AND center_id = get_my_center_id()
    )
  );

-- 3. New UPDATE policy: any employee in the center can update tokens
-- (needed so any employee can mark a token as 'used')
CREATE POLICY "Token updates" ON tokens
  FOR UPDATE USING (
    -- I can update tokens I generated
    generated_by = auth.uid()
    OR (
      -- Or any token in my center
      center_id IS NOT NULL
      AND center_id = get_my_center_id()
    )
  );

-- ============================================
-- Verification:
--   Log in as an employee and run:
--     SELECT * FROM tokens WHERE center_id = '<your_center_id>';
--   You should now see ALL tokens in your center.
-- ============================================
