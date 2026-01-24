-- =====================================================
-- Order Notes - history log for internal/client notes
-- =====================================================

CREATE TABLE order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('internal', 'client')),
  body TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_notes_tenant ON order_notes(tenant_id);
CREATE INDEX idx_order_notes_order ON order_notes(order_id);
CREATE INDEX idx_order_notes_type ON order_notes(note_type);
CREATE INDEX idx_order_notes_created_at ON order_notes(created_at DESC);

ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view order notes" ON order_notes
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert order notes" ON order_notes
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update order notes" ON order_notes
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can delete order notes" ON order_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = order_notes.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
