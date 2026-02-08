-- ============================================
-- SQL Update for Self-Registration
-- ============================================
-- Run this in the Supabase SQL Editor to update the trigger function.

-- 1. Create or Replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  user_role TEXT;
BEGIN
  -- Get the role from metadata (default to 'employee' if not specified)
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'employee');

  -- VALIDATION: Ensure role is valid
  IF user_role NOT IN ('manager', 'employee') THEN
    user_role := 'employee';
  END IF;

  -- Check if a user with this email already exists in public.users (Manual Pre-Add Case)
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = new.email;

  IF existing_user_id IS NOT NULL THEN
    -- Case 1: User was pre-added by a manager. Link the accounts.
    UPDATE public.users
    SET id = new.id,
        is_active = true
    WHERE email = new.email;
  ELSE
    -- Case 2: User is registering themselves. Create a new public profile.
    INSERT INTO public.users (id, email, role, is_active)
    VALUES (
      new.id, 
      new.email, 
      user_role, 
      true
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger is still active (it should be, but just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- Update Complete
-- ============================================
