-- ============================================
-- ENABLE REALTIME REPLICATION for TOKENS
-- ============================================
-- This script ensures Supabase broadcasts changes to the 'tokens' table
-- to connected clients.

-- 1. Create the publication if it doesn't exist (Supabase default)
-- (Usually exists, but good to be safe)
-- CREATE PUBLICATION supabase_realtime;

-- 2. Add 'tokens' table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tokens;

-- 3. Verify it's added
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
