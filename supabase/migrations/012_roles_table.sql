-- ============================================
-- Migration 012: Roles Reference Table
-- ============================================
-- Replaces the hardcoded CHECK (role IN ('manager','employee')) constraint
-- on users.role with a proper foreign key to a roles reference table.
--
-- Adding a new role in future only requires:
--   INSERT INTO roles (role_name, description) VALUES ('auditor', 'Read-only auditor');
-- No schema migration needed.

-- 1. Create the roles reference table
CREATE TABLE IF NOT EXISTS roles (
  role_name   TEXT PRIMARY KEY,
  description TEXT
);

-- 2. Seed the existing roles
INSERT INTO roles (role_name, description) VALUES
  ('manager',  'Full access — can manage employees, tokens, and all data'),
  ('employee', 'Standard access — can submit entries and manage own tokens')
ON CONFLICT (role_name) DO NOTHING;

-- 3. Enable RLS on roles (read-only for all authenticated users)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are readable by authenticated users" ON roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Drop the old CHECK constraint on users.role
--    PostgreSQL doesn't support ALTER TABLE … DROP CONSTRAINT by the constraint
--    expression — we need its name. The original setup used an unnamed CHECK,
--    which Postgres auto-names as "users_role_check". Adjust if yours differs.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 5. Add a FK referencing the roles table
ALTER TABLE users
  ADD CONSTRAINT users_role_fk
  FOREIGN KEY (role) REFERENCES roles(role_name)
  ON UPDATE CASCADE;   -- If a role_name is ever renamed, cascade to users

-- ============================================
-- To verify:
--   SELECT * FROM roles;
--   SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;
-- ============================================
