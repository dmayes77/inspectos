-- The direct self-join in the co-member profiles policy caused infinite
-- recursion: profiles policy → tenant_members (RLS) → is_tenant_member()
-- → tenant_members again → same RLS policy → loop.
--
-- Fix: wrap the co-membership check in a SECURITY DEFINER function so
-- tenant_members RLS is bypassed when the function runs.

DROP POLICY IF EXISTS "Tenant members can view co-member profiles" ON profiles;

CREATE OR REPLACE FUNCTION is_co_member(other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tenant_members tm1
    JOIN tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = other_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Tenant members can view co-member profiles"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_co_member(id));
