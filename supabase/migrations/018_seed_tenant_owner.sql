-- =====================================================
-- Seed Tenant + Owner (requires Auth user to exist)
-- =====================================================

-- Tenant
INSERT INTO tenants (id, name, slug)
VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Demo Company', 'demo')
ON CONFLICT (id) DO NOTHING;

-- Profile from auth.users (must exist)
INSERT INTO profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email) AS full_name
FROM auth.users
WHERE id = 'ccd639ca-8c80-437f-b5fb-f39ab126097d'
ON CONFLICT (id) DO NOTHING;

-- Membership
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'ccd639ca-8c80-437f-b5fb-f39ab126097d', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;
