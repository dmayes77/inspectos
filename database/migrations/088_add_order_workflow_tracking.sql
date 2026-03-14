CREATE TABLE IF NOT EXISTS public.order_workflow_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  workflow_state text NOT NULL CHECK (workflow_state IN (
    'not_assigned',
    'assigned',
    'arrived',
    'in_progress',
    'paused',
    'waiting_for_info',
    'uploading',
    'ready_for_review',
    'corrections_required',
    'completed'
  )),
  current_blocker_type text,
  current_blocker_notes text,
  current_blocker_reported_at timestamptz,
  current_blocker_reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_blocker_resolution_notes text,
  current_blocker_resolved_at timestamptz,
  current_blocker_resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_workflow_states_tenant_order_unique UNIQUE (tenant_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_workflow_states_lookup
  ON public.order_workflow_states (tenant_id, order_id);

CREATE INDEX IF NOT EXISTS idx_order_workflow_states_state
  ON public.order_workflow_states (tenant_id, workflow_state);

CREATE TABLE IF NOT EXISTS public.order_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_time timestamptz NOT NULL,
  device_id text NOT NULL,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_state text NOT NULL CHECK (from_state IN (
    'not_assigned',
    'assigned',
    'arrived',
    'in_progress',
    'paused',
    'waiting_for_info',
    'uploading',
    'ready_for_review',
    'corrections_required',
    'completed'
  )),
  to_state text NOT NULL CHECK (to_state IN (
    'not_assigned',
    'assigned',
    'arrived',
    'in_progress',
    'paused',
    'waiting_for_info',
    'uploading',
    'ready_for_review',
    'corrections_required',
    'completed'
  )),
  trigger text NOT NULL CHECK (trigger IN (
    'ORDER_ACCEPTED',
    'ARRIVAL_CONFIRMED',
    'INSPECTION_STARTED',
    'INSPECTION_PAUSED',
    'INSPECTION_RESUMED',
    'BLOCKER_REPORTED',
    'BLOCKER_CLEARED',
    'SYNC_STARTED',
    'SYNC_COMPLETED',
    'QA_REJECTED',
    'CORRECTIONS_ACKNOWLEDGED',
    'QA_APPROVED',
    'AUTO_APPROVED'
  )),
  checklist_version text,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_workflow_events_tenant_event_unique UNIQUE (tenant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_order_workflow_events_lookup
  ON public.order_workflow_events (tenant_id, order_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_order_workflow_events_trigger
  ON public.order_workflow_events (tenant_id, trigger);

DROP TRIGGER IF EXISTS update_order_workflow_states_updated_at ON public.order_workflow_states;
CREATE TRIGGER update_order_workflow_states_updated_at
  BEFORE UPDATE ON public.order_workflow_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.order_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view order workflow states" ON public.order_workflow_states;
CREATE POLICY "Members can view order workflow states"
ON public.order_workflow_states
FOR SELECT
TO authenticated
USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Members can insert order workflow states" ON public.order_workflow_states;
CREATE POLICY "Members can insert order workflow states"
ON public.order_workflow_states
FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Members can update order workflow states" ON public.order_workflow_states;
CREATE POLICY "Members can update order workflow states"
ON public.order_workflow_states
FOR UPDATE
TO authenticated
USING (public.is_tenant_member(tenant_id))
WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Members can view order workflow events" ON public.order_workflow_events;
CREATE POLICY "Members can view order workflow events"
ON public.order_workflow_events
FOR SELECT
TO authenticated
USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Members can insert order workflow events" ON public.order_workflow_events;
CREATE POLICY "Members can insert order workflow events"
ON public.order_workflow_events
FOR INSERT
TO authenticated
WITH CHECK (public.is_tenant_member(tenant_id));
