-- ============================================
-- CRM System Database Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor to set up the complete database schema
-- with Row Level Security policies for role-based access control

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Managers can see all users, employees can only see themselves
CREATE POLICY "Users visibility" ON users
  FOR SELECT USING (
    role = 'manager' OR 
    id = auth.uid()
  );

-- RLS Policy: Only managers can insert new users
CREATE POLICY "Managers can add users" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
  );

-- RLS Policy: Only managers can update users
CREATE POLICY "Managers can update users" ON users
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  generated_by UUID REFERENCES users(id) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  used_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own tokens, managers see all
CREATE POLICY "Tokens visibility" ON tokens
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager' OR
    generated_by = auth.uid()
  );

-- RLS Policy: Anyone authenticated can generate tokens
CREATE POLICY "Anyone can generate tokens" ON tokens
  FOR INSERT WITH CHECK (generated_by = auth.uid());

-- RLS Policy: Managers can update any token, users can update their own
CREATE POLICY "Token updates" ON tokens
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager' OR
    generated_by = auth.uid()
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_token_id ON tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_customer_phone ON tokens(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tokens_generated_by ON tokens(generated_by);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);

-- ============================================
-- 3. FORM ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES users(id) NOT NULL,
  token_used TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  contact_number TEXT,
  estimated_cost DECIMAL(10, 2)
);

-- Enable Row Level Security
ALTER TABLE form_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Managers see all entries, employees see only their own entries from today
CREATE POLICY "Form entries visibility" ON form_entries
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager' OR
    (employee_id = auth.uid() AND DATE(submitted_at) = CURRENT_DATE)
  );

-- RLS Policy: Employees can insert their own entries
CREATE POLICY "Employees can insert their own entries" ON form_entries
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- RLS Policy: Managers can update any entry, employees can update their own from today
CREATE POLICY "Entry updates" ON form_entries
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager' OR
    (employee_id = auth.uid() AND DATE(submitted_at) = CURRENT_DATE)
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_form_entries_employee ON form_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_entries_date ON form_entries(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_entries_token ON form_entries(token_used);
CREATE INDEX IF NOT EXISTS idx_form_entries_status ON form_entries(status);

-- ============================================
-- 4. HELPER FUNCTIONS (Optional but useful)
-- ============================================

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid()) = 'manager';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if entry is from today
CREATE OR REPLACE FUNCTION is_today(entry_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN DATE(entry_date) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. AUTOMATED AUTH SYNC TRIGGER
-- ============================================

-- This trigger automatically links the public user record (created by manager)
-- with the auth user record (created on sign up) by matching emails.

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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- 6. INITIAL DATA (Optional - for testing)
-- ============================================

-- Note: You'll need to create the first manager account manually
-- After a user signs up via magic link, run this to make them a manager:
-- 
-- INSERT INTO users (id, email, role, is_active)
-- VALUES (
--   'paste-auth-user-id-here',
--   'manager@example.com',
--   'manager',
--   true
-- );

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Run these to verify the setup:

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'tokens', 'form_entries');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tokens', 'form_entries');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================
-- 7. CLEANUP (if needed)
-- ============================================

-- Uncomment and run these if you need to reset the database:

-- DROP TABLE IF EXISTS form_entries CASCADE;
-- DROP TABLE IF EXISTS tokens CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS is_manager();
-- DROP FUNCTION IF EXISTS is_today(TIMESTAMP WITH TIME ZONE);

-- ============================================
-- Setup Complete!
-- ============================================
-- Next steps:
-- 1. Configure authentication in Supabase Dashboard
-- 2. Create your first manager user
-- 3. Update .env.local with your Supabase credentials
-- 4. Run the application with npm run dev
