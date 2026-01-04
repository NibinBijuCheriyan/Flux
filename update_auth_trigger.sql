-- ============================================
-- FIX: Update Auth Sync Trigger
-- ============================================
-- This script updates the trigger that runs when a new user signs up.
-- It ensures that a public.users record is created with the correct role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  user_role TEXT;
BEGIN
  -- 1. Extract role from metadata, default to 'employee' if missing
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'employee');

  -- 2. Check if a user with this email already exists in public.users
  -- (This handles cases where a manager added the user before they signed up)
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = new.email;

  IF existing_user_id IS NOT NULL THEN
    -- Update the existing public user's ID to match the new auth ID
    -- This links the two records permanently
    UPDATE public.users
    SET id = new.id,
        is_active = true,
        -- Optionally update role if it was different/missing
        role = user_role 
    WHERE email = new.email;
  ELSE
    -- 3. If NO existing record, insert a new one
    INSERT INTO public.users (id, email, role, is_active)
    VALUES (new.id, new.email, user_role, true);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (just to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


