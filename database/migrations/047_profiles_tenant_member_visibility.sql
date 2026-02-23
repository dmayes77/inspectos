-- Allow tenant members to view profiles of other members in the same tenant.
-- The existing "Users can view own profile" policy covers self-reads.
-- This policy covers reading co-members' profiles (needed for team, orders, schedule, payouts routes).

CREATE POLICY "Tenant members can view co-member profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tenant_members tm1
    JOIN tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.id
  )
);
