-- ============================================
-- Migration 013: Center-Based Multi-Tenancy
-- ============================================
-- Adds:
--   1. centers table
--   2. center_id column to users, tokens, form_entries
--   3. Updated RLS policies scoped per-center
--
-- Prerequisites: 009, 011, 012 must have been run.
-- Run in Supabase SQL Editor.

-- ============================================
-- 1. CENTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS centers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  location   TEXT NOT NULL DEFAULT '',
  code       TEXT UNIQUE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read centers (needed to display center name in UI)
CREATE POLICY "Centers readable by authenticated users" ON centers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only users with 'center_manager' role can insert/update centers
CREATE POLICY "Managers can manage centers" ON centers
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
  );

CREATE INDEX IF NOT EXISTS idx_centers_code ON centers(code);

-- ============================================
-- 2. ADD center_id TO users TABLE
-- ============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_center_id ON users(center_id);

-- ============================================
-- 3. ADD center_id TO tokens TABLE
-- ============================================
ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_center_id ON tokens(center_id);

-- ============================================
-- 4. ADD center_id TO form_entries TABLE
-- ============================================
ALTER TABLE form_entries
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_form_entries_center_id ON form_entries(center_id);

-- ============================================
-- 5. REPLACE RLS POLICIES (center-scoped)
-- ============================================
-- Drop old scope policies from 009 / 001
DROP POLICY IF EXISTS "Users visibility" ON users;
DROP POLICY IF EXISTS "Managers can add users" ON users;
DROP POLICY IF EXISTS "Managers can update users" ON users;
DROP POLICY IF EXISTS "Tokens visibility" ON tokens;
DROP POLICY IF EXISTS "Anyone can generate tokens" ON tokens;
DROP POLICY IF EXISTS "Token updates" ON tokens;
DROP POLICY IF EXISTS "Form entries visibility" ON form_entries;
DROP POLICY IF EXISTS "Employees can insert their own entries" ON form_entries;
DROP POLICY IF EXISTS "Entry updates" ON form_entries;

-- Helper: get the caller's center_id
CREATE OR REPLACE FUNCTION get_my_center_id()
RETURNS UUID AS $$
  SELECT center_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----- USERS -----
-- Managers see everyone in their center; employees see only themselves
CREATE POLICY "Users visibility" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR (
      center_id IS NOT NULL
      AND center_id = get_my_center_id()
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    )
    -- Pending users (center_id IS NULL): managers can see them if added_by = auth.uid()
    OR (center_id IS NULL AND added_by = auth.uid())
  );

-- Managers can insert new pre-created employee rows in their center
CREATE POLICY "Managers can add users" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
  );

-- Managers can update users in their center (including approving pending employees)
CREATE POLICY "Managers can update users" ON users
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    AND (
      center_id = get_my_center_id()   -- already in same center
      OR added_by = auth.uid()          -- or pending (center_id NULL, added by this manager)
    )
  );

-- ----- TOKENS -----
CREATE POLICY "Tokens visibility" ON tokens
  FOR SELECT USING (
    generated_by = auth.uid()
    OR (
      center_id IS NOT NULL
      AND center_id = get_my_center_id()
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    )
  );

CREATE POLICY "Anyone can generate tokens" ON tokens
  FOR INSERT WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Token updates" ON tokens
  FOR UPDATE USING (
    generated_by = auth.uid()
    OR (
      center_id = get_my_center_id()
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    )
  );

-- ----- FORM ENTRIES -----
CREATE POLICY "Form entries visibility" ON form_entries
  FOR SELECT USING (
    employee_id = auth.uid()
    OR (
      center_id IS NOT NULL
      AND center_id = get_my_center_id()
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    )
  );

CREATE POLICY "Employees can insert their own entries" ON form_entries
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Entry updates" ON form_entries
  FOR UPDATE USING (
    employee_id = auth.uid()
    OR (
      center_id = get_my_center_id()
      AND (SELECT role FROM users WHERE id = auth.uid()) = 'center_manager'
    )
  );

-- ============================================
-- 6. SEED: rename existing 'manager' role to 'center_manager'
-- ============================================
-- If you ran 012_roles_table.sql, add the new role:
INSERT INTO roles (role_name, description)
VALUES ('center_manager', 'Manages a single center — sees all data within their center')
ON CONFLICT (role_name) DO NOTHING;

-- Migrate any existing 'manager' users to 'center_manager'
UPDATE users SET role = 'center_manager' WHERE role = 'manager';

-- ============================================
-- Verification:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('users','tokens','form_entries')
--   AND column_name = 'center_id';
--
--   SELECT * FROM centers;
-- ============================================
