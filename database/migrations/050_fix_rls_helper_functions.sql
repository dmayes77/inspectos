-- SECURITY DEFINER alone does NOT prevent infinite recursion in RLS policies.
-- PostgreSQL still evaluates row security using the calling user's context.
-- Adding SET LOCAL row_security = off inside SECURITY DEFINER functions
-- disables RLS within that function call, breaking the recursive loop.
--
-- Fixes: 42P17 "infinite recursion detected in policy for relation tenant_members"

-- Fix is_tenant_member: used widely in RLS policies across all tables
CREATE OR REPLACE FUNCTION is_tenant_member(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_members.tenant_id = $1
      AND tenant_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix is_co_member: used in the profiles co-member policy
CREATE OR REPLACE FUNCTION is_co_member(other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN EXISTS (
    SELECT 1
    FROM tenant_members tm1
    JOIN tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = other_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
