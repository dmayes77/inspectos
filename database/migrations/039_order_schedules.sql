-- Decouple inspection scheduling into dedicated order_schedules table
CREATE TABLE order_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'primary' CHECK (schedule_type IN ('primary','addon','package','follow_up','reinspection','other')),
  label TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slot_date DATE,
  slot_start TIME WITHOUT TIME ZONE,
  slot_end TIME WITHOUT TIME ZONE,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','in_progress','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_schedules_order ON order_schedules(order_id);
CREATE INDEX idx_order_schedules_tenant ON order_schedules(tenant_id);
CREATE INDEX idx_order_schedules_slot_date ON order_schedules(slot_date);

CREATE TRIGGER update_order_schedules_updated_at
  BEFORE UPDATE ON order_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE order_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view order schedules"
  ON order_schedules
  FOR SELECT
  USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can manage order schedules"
  ON order_schedules
  FOR ALL
  USING (is_tenant_member(tenant_id));

ALTER TABLE inspections ADD COLUMN order_schedule_id UUID REFERENCES order_schedules(id) ON DELETE SET NULL;

CREATE INDEX idx_inspections_order_schedule ON inspections(order_schedule_id);

WITH inserted AS (
  INSERT INTO order_schedules (
    tenant_id,
    order_id,
    schedule_type,
    label,
    inspector_id,
    slot_date,
    slot_start,
    slot_end,
    duration_minutes,
    status,
    notes
  )
  SELECT
    o.tenant_id,
    o.id,
    'primary',
    'Primary Inspection',
    o.inspector_id,
    o.scheduled_date,
    o.scheduled_time,
    CASE
      WHEN o.scheduled_time IS NOT NULL AND o.duration_minutes IS NOT NULL
        THEN (o.scheduled_time + (o.duration_minutes::text || ' minutes')::interval)::time
      ELSE NULL
    END,
    o.duration_minutes,
    CASE
      WHEN o.status IN ('in_progress','pending_report','delivered','completed') THEN 'in_progress'
      WHEN o.status = 'cancelled' THEN 'cancelled'
      WHEN o.scheduled_date IS NOT NULL THEN 'scheduled'
      ELSE 'pending'
    END,
    o.internal_notes
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM order_schedules os WHERE os.order_id = o.id AND os.schedule_type = 'primary'
  )
  RETURNING order_id, id
)
UPDATE inspections i
SET order_schedule_id = inserted.id
FROM inserted
WHERE i.order_id = inserted.order_id AND i.order_schedule_id IS NULL;
