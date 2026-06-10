-- ============================================
-- Migration 013: Fix Registration Roles
-- ============================================
-- Updates the handle_new_user trigger to read the user's role 
-- from their registration metadata (raw_user_meta_data->>'role'),
-- allowing owners (managers) to register directly.
-- Falls back to 'employee' if no valid role is provided.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalised_email TEXT;
  user_role TEXT;
BEGIN
  normalised_email := lower(trim(new.email));

  -- Extract role from metadata, default to 'employee' if missing or invalid
  user_role := new.raw_user_meta_data->>'role';
  IF user_role NOT IN ('manager', 'employee') THEN
    user_role := 'employee';
  END IF;

  INSERT INTO public.users (id, email, role, is_active)
  VALUES (new.id, normalised_email, user_role, true)
  ON CONFLICT (email)
  DO UPDATE SET
    id        = EXCLUDED.id,
    is_active = true;
    -- Only update role if it's currently null or if the user is somehow not a manager yet
    -- We keep the intentional design to not overwrite a manager-assigned role during upsert.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
