-- ============================================
-- Migration 018: Auto-Create Center for Owners
-- ============================================
-- 1. Updates handle_new_user to recognize the 'owner' role.
-- 2. Automatically creates a center for new owners upon registration.
-- 3. Backfills existing owners who are missing a center.

-- Update the auth trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalised_email TEXT;
  user_role TEXT;
  new_center_id UUID;
BEGIN
  normalised_email := lower(trim(new.email));

  -- Extract role from metadata, default to 'employee' if missing or invalid
  user_role := new.raw_user_meta_data->>'role';
  IF user_role NOT IN ('owner', 'employee') THEN
    user_role := 'employee';
  END IF;

  -- Auto-create a center if the user is an owner
  IF user_role = 'owner' THEN
    INSERT INTO public.centers (name, code, status)
    VALUES (
      normalised_email || '''s Center',
      upper(substring(md5(random()::text) from 1 for 8)), -- Random 8 char code
      'active'
    )
    RETURNING id INTO new_center_id;
  END IF;

  INSERT INTO public.users (id, email, role, center_id, is_active)
  VALUES (new.id, normalised_email, user_role, new_center_id, true)
  ON CONFLICT (email)
  DO UPDATE SET
    id        = EXCLUDED.id,
    is_active = true,
    center_id = COALESCE(users.center_id, EXCLUDED.center_id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing owners who don't have a center
DO $$
DECLARE
  owner_rec RECORD;
  new_c_id UUID;
BEGIN
  FOR owner_rec IN SELECT id, email FROM public.users WHERE role = 'owner' AND center_id IS NULL LOOP
    INSERT INTO public.centers (name, code, status)
    VALUES (
      owner_rec.email || '''s Center',
      upper(substring(md5(random()::text) from 1 for 8)),
      'active'
    )
    RETURNING id INTO new_c_id;

    UPDATE public.users SET center_id = new_c_id WHERE id = owner_rec.id;
  END LOOP;
END;
$$;
