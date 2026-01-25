-- Create helper so we can manually refresh PostgREST schema cache when
-- columns get added/dropped outside the Supabase dashboard.

BEGIN;

CREATE SCHEMA IF NOT EXISTS supabase_functions;

CREATE OR REPLACE FUNCTION supabase_functions.refresh_schema_cache()
RETURNS BOOLEAN AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
