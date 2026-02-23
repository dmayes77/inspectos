-- Restore compatibility column properties.client_id for legacy code paths
-- while keeping property_owners as source of truth.

BEGIN;

-- 1) Reintroduce client_id column if it was dropped manually.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 2) Helpful index for tenant/client lookups.
CREATE INDEX IF NOT EXISTS idx_properties_client ON properties(client_id);

-- 3) Backfill current owners from property_owners (primary, active owner wins).
WITH latest_owner AS (
  SELECT DISTINCT ON (property_id)
    property_id,
    client_id
  FROM property_owners
  WHERE end_date IS NULL
  ORDER BY property_id, is_primary DESC, start_date DESC, created_at DESC
)
UPDATE properties p
SET client_id = lo.client_id
FROM latest_owner lo
WHERE lo.property_id = p.id;

-- 4) Trigger to keep properties.client_id in sync with property_owners.
CREATE OR REPLACE FUNCTION sync_property_current_client()
RETURNS TRIGGER AS $$
DECLARE
  replacement_client UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.end_date IS NULL AND NEW.is_primary THEN
      UPDATE properties SET client_id = NEW.client_id, updated_at = NOW()
      WHERE id = NEW.property_id;
    ELSIF (SELECT client_id FROM properties WHERE id = NEW.property_id) IS NULL THEN
      UPDATE properties SET client_id = NEW.client_id, updated_at = NOW()
      WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.end_date IS NULL AND NEW.is_primary THEN
      UPDATE properties SET client_id = NEW.client_id, updated_at = NOW()
      WHERE id = NEW.property_id;
    ELSIF OLD.end_date IS NULL AND OLD.is_primary AND (NEW.end_date IS NOT NULL OR NOT NEW.is_primary) THEN
      SELECT po.client_id INTO replacement_client
      FROM property_owners po
      WHERE po.property_id = NEW.property_id
        AND po.end_date IS NULL
      ORDER BY po.is_primary DESC, po.start_date DESC, po.created_at DESC
      LIMIT 1;

      UPDATE properties SET client_id = replacement_client, updated_at = NOW()
      WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.end_date IS NULL AND OLD.is_primary THEN
      SELECT po.client_id INTO replacement_client
      FROM property_owners po
      WHERE po.property_id = OLD.property_id
        AND po.end_date IS NULL
      ORDER BY po.is_primary DESC, po.start_date DESC, po.created_at DESC
      LIMIT 1;

      UPDATE properties SET client_id = replacement_client, updated_at = NOW()
      WHERE id = OLD.property_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_owners_sync_property_client ON property_owners;
CREATE TRIGGER property_owners_sync_property_client
  AFTER INSERT OR UPDATE OR DELETE ON property_owners
  FOR EACH ROW EXECUTE FUNCTION sync_property_current_client();

COMMIT;
