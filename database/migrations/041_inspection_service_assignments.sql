-- Migration: Move inspector and vendor assignments to service level
-- This allows different inspectors/vendors to handle different services within the same inspection

-- Add inspector_id and vendor_id to inspection_services table
ALTER TABLE inspection_services
ADD COLUMN inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX idx_inspection_services_inspector ON inspection_services(inspector_id);
CREATE INDEX idx_inspection_services_vendor ON inspection_services(vendor_id);

-- Migrate existing inspector assignments from orders to inspection_services
-- For each inspection service, inherit the inspector from its parent order
UPDATE inspection_services AS ins_svc
SET inspector_id = o.inspector_id
FROM inspections AS insp
JOIN orders AS o ON o.id = insp.order_id
WHERE ins_svc.inspection_id = insp.id
  AND o.inspector_id IS NOT NULL
  AND ins_svc.inspector_id IS NULL;

-- Add comment explaining the new structure
COMMENT ON COLUMN inspection_services.inspector_id IS 'Inspector assigned to this specific service. Allows different inspectors for different services within the same inspection.';
COMMENT ON COLUMN inspection_services.vendor_id IS 'Vendor assigned to this specific service. Allows different vendors for different services within the same inspection.';

-- Note: We keep orders.inspector_id for now for backward compatibility
-- It can represent the "primary" inspector or be deprecated in a future migration
COMMENT ON COLUMN orders.inspector_id IS 'Primary inspector for the order (legacy). Consider using inspection_services.inspector_id for per-service assignments.';
