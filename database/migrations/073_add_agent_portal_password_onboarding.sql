-- Add password-based auth fields for agent portal onboarding/login.
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS portal_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS portal_password_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_invite_consumed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agents_portal_password_set
  ON public.agents (tenant_id, portal_password_set_at);
