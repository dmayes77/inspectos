-- The root cause of 42P17 infinite recursion:
--
-- "Members can view memberships" on tenant_members calls is_tenant_member(tenant_id),
-- which queries tenant_members, which fires the same policy again → loop.
--
-- "Owners can manage memberships" on tenant_members has a direct self-join on
-- tenant_members inside the policy expression → also recursive.
--
-- SET LOCAL row_security = off inside SECURITY DEFINER functions does NOT
-- prevent this because PostgreSQL's recursion guard fires at policy evaluation
-- time, before the function body executes.
--
-- Fix: replace both policies with simple auth.uid() checks that never
-- query the same table. Routes that need to list all tenant members
-- (team, inspectors) must use the service role client.

-- 1. Drop the recursive policies
DROP POLICY IF EXISTS "Members can view memberships" ON tenant_members;
DROP POLICY IF EXISTS "Owners can manage memberships" ON tenant_members;
DROP POLICY IF EXISTS "Users can create own membership" ON tenant_members;

-- 2. Non-recursive SELECT: users can only see their own membership row
CREATE POLICY "Users can view own memberships" ON tenant_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 3. Non-recursive INSERT: users can create their own membership (sign-up flow)
CREATE POLICY "Users can create own membership" ON tenant_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 4. All other mutations (UPDATE, DELETE) are handled via service role in
--    server routes — no user-level RLS policy needed.

-- 5. Drop the is_co_member based profiles policy (it relied on seeing all
--    tenant_members rows, which is no longer allowed under user RLS).
--    Inspector/team listings are now handled server-side with serviceClient.
DROP POLICY IF EXISTS "Tenant members can view co-member profiles" ON profiles;
