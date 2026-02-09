-- Allow order-first inspections without legacy jobs
ALTER TABLE inspections ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE inspections ALTER COLUMN template_id DROP NOT NULL;
ALTER TABLE inspections ALTER COLUMN inspector_id DROP NOT NULL;
