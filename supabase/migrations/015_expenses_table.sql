-- ============================================================
-- Migration 015: Expense Tracking
-- ============================================================
-- Adds an `expenses` table so staff can log operational expenses
-- at the service center. Center-scoped via RLS.
--
-- Prerequisites: 013_center_id.sql must have been run.
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id     UUID REFERENCES centers(id) ON DELETE CASCADE,
    logged_by     UUID REFERENCES users(id) NOT NULL,
    category      TEXT NOT NULL CHECK (
                      category IN (
                          'rent', 'utilities', 'supplies', 'maintenance',
                          'salary', 'transport', 'food', 'miscellaneous'
                      )
                  ),
    amount        DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description   TEXT,
    expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ---- SELECT: all authenticated users in the same center ----
CREATE POLICY "Users can view center expenses" ON expenses
    FOR SELECT USING (
        center_id IN (SELECT center_id FROM users WHERE id = auth.uid())
    );

-- ---- INSERT: any authenticated user (must be self) ----
CREATE POLICY "Staff can log expenses" ON expenses
    FOR INSERT WITH CHECK (
        logged_by = auth.uid()
    );

-- ---- UPDATE: only owner / center_manager in the same center ----
CREATE POLICY "Managers can update expenses" ON expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('owner', 'center_manager', 'super_admin')
            AND users.center_id = expenses.center_id
        )
    );

-- ---- DELETE: only owner / center_manager in the same center ----
CREATE POLICY "Managers can delete expenses" ON expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('owner', 'center_manager', 'super_admin')
            AND users.center_id = expenses.center_id
        )
    );

-- ---- Indexes for common queries ----
CREATE INDEX IF NOT EXISTS idx_expenses_center_id    ON expenses(center_id);
CREATE INDEX IF NOT EXISTS idx_expenses_logged_by    ON expenses(logged_by);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category     ON expenses(category);
