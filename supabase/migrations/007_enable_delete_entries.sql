-- ============================================
-- ENABLE DELETE FOR MANAGERS
-- ============================================

-- RLS Policy: Only managers can delete form entries
CREATE POLICY "Managers can delete entries" ON form_entries
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
  );
