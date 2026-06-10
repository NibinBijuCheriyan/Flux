-- ============================================
-- Migration 019: Fix Foreign Key Constraints
-- ============================================
-- Allows deleting a user from the public.users table without 
-- foreign key restriction errors from the 'added_by' column.

ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_added_by_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_added_by_fkey 
  FOREIGN KEY (added_by) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;
