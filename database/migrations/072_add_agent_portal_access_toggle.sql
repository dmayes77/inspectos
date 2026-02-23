-- Add explicit agent portal access toggle and enforce it in portal RLS checks.
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_agents_portal_access
  ON public.agents (tenant_id, portal_access_enabled);

DROP POLICY IF EXISTS "Agents can view own via magic link" ON public.agents;
CREATE POLICY "Agents can view own via magic link" ON public.agents
  FOR SELECT USING (
    portal_access_enabled = TRUE
    AND status = 'active'
    AND magic_link_token IS NOT NULL
    AND magic_link_expires_at > NOW()
  );

DROP POLICY IF EXISTS "Agents can view referred orders via portal" ON public.orders;
CREATE POLICY "Agents can view referred orders via portal" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = orders.agent_id
      AND a.portal_access_enabled = TRUE
      AND a.status = 'active'
      AND a.magic_link_token IS NOT NULL
      AND a.magic_link_expires_at > NOW()
    )
  );
