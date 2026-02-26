-- ============================================
-- Migration 011: Robust Auth Trigger (Upsert)
-- ============================================
-- Replaces the handle_new_user trigger with an atomic upsert.
--
-- Key improvements over 010_update_auth_trigger.sql:
--   1. Uses INSERT ... ON CONFLICT (email) DO UPDATE — atomic, no race condition.
--   2. Normalises email to lowercase before matching/inserting.
--   3. Does NOT override an existing manager-assigned role on conflict;
--      only updates the `id` and `is_active` fields to link the auth account.
--   4. When inserting a brand-new user (no pre-created row), defaults role
--      to 'employee' regardless of sign-up metadata, since public sign-ups
--      are disabled. The manager must explicitly set roles via the dashboard.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalised_email TEXT;
BEGIN
  normalised_email := lower(trim(new.email));

  INSERT INTO public.users (id, email, role, is_active)
  VALUES (new.id, normalised_email, 'employee', true)
  ON CONFLICT (email)
  DO UPDATE SET
    id        = EXCLUDED.id,
    is_active = true;
    -- NOTE: role is intentionally NOT updated here.
    -- The manager pre-assigns the correct role; we mustn't overwrite it.

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
