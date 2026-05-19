-- ============================================================
-- Migration 014: External Service Links
-- ============================================================

CREATE TABLE IF NOT EXISTS service_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    username TEXT,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_links ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users in the same center to view services
CREATE POLICY "Users can view center services" ON service_links
    FOR SELECT USING (
        center_id IN (SELECT center_id FROM users WHERE id = auth.uid())
    );

-- Only center managers or super admins can insert services for their center
CREATE POLICY "Managers can insert services" ON service_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('center_manager', 'super_admin')
            AND users.center_id = service_links.center_id
        )
    );

-- Only center managers or super admins can update services for their center
CREATE POLICY "Managers can update services" ON service_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('center_manager', 'super_admin')
            AND users.center_id = service_links.center_id
        )
    );

-- Only center managers or super admins can delete services for their center
CREATE POLICY "Managers can delete services" ON service_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('center_manager', 'super_admin')
            AND users.center_id = service_links.center_id
        )
    );
