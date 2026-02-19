BEGIN;

ALTER TABLE workflows
ADD COLUMN event_type TEXT;

ALTER TABLE workflows
ADD CONSTRAINT workflows_event_trigger_type_check
  CHECK (event_type IS NULL OR trigger_type = 'event');

ALTER TABLE workflows
ADD CONSTRAINT workflows_event_type_required_for_event_trigger
  CHECK (trigger_type != 'event' OR event_type IS NOT NULL);

COMMIT;
