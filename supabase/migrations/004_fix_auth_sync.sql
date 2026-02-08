-- ============================================
-- FIX: Manually Sync User Profile
-- ============================================
-- This script manually links the Auth User (Login) to the Public Profile.
-- It fixes the "Profile Not Found" error.

DO $$
DECLARE
  v_email TEXT := 'nibinbijucheriyan06@gmail.com'; -- The email having issues
  v_auth_id UUID;
BEGIN
  -- 1. Get the Auth ID from auth.users
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = v_email;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'User % not found in auth system. Have they signed up?', v_email;
    RETURN;
  END IF;

  -- 2. Upsert into public.users
  -- This creates the profile if missing, or updates the ID if it exists
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (v_auth_id, v_email, 'manager', true) -- Assuming 'manager' for this fix
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id,
      is_active = true,
      role = COALESCE(users.role, 'manager'); -- Keep existing role or default to manager

  RAISE NOTICE 'Fixed profile for %', v_email;
END;
$$;
