-- ============================================
-- AUTOMATED AUTH SYNC TRIGGER SETUP
-- ============================================

-- Run this script to install the automated synchronization trigger.
-- This solves the "ID Mismatch" issue permanently for all future users.

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if a user with this email already exists in public.users
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = new.email;

  IF existing_user_id IS NOT NULL THEN
    -- Update the existing public user's ID to match the new auth ID
    -- This links the two records permanently
    UPDATE public.users
    SET id = new.id,
        is_active = true
    WHERE email = new.email;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FIX FOR EXISTING MISMATCHED USERS (Generic, NO hardcoding)
-- This block finds ANY user whose email matches but ID differs, and fixes them.
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN SELECT * FROM auth.users LOOP
    UPDATE public.users
    SET id = auth_user.id
    WHERE email = auth_user.email
    AND id != auth_user.id;
  END LOOP;
END;
$$;
