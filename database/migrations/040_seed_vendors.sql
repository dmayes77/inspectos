-- Seed vendors for demo tenant
INSERT INTO vendors (id, tenant_id, name, vendor_type, email, phone, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Acme Pest Control', 'Pest', 'acme@example.com', '555-1234', 'active', NOW(), NOW()),
  (gen_random_uuid(), 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Roof Pros', 'Roof', 'roofpros@example.com', '555-5678', 'active', NOW(), NOW());
