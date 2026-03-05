-- =====================================================
-- Mobile Quick Capture media storage
-- =====================================================

CREATE TABLE IF NOT EXISTS quick_capture_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text NOT NULL,
  captured_at timestamptz NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy_meters double precision,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quick_capture_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT quick_capture_longitude_range CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX IF NOT EXISTS idx_quick_capture_media_tenant_user_captured
  ON quick_capture_media(tenant_id, user_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_quick_capture_media_storage_path
  ON quick_capture_media(storage_path);

ALTER TABLE quick_capture_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quick captures" ON quick_capture_media;
CREATE POLICY "Users can view own quick captures"
ON quick_capture_media FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can insert own quick captures" ON quick_capture_media;
CREATE POLICY "Users can insert own quick captures"
ON quick_capture_media FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can update own quick captures" ON quick_capture_media;
CREATE POLICY "Users can update own quick captures"
ON quick_capture_media FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
)
WITH CHECK (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can delete own quick captures" ON quick_capture_media;
CREATE POLICY "Users can delete own quick captures"
ON quick_capture_media FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quick-captures',
  'quick-captures',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own quick captures" ON storage.objects;
CREATE POLICY "Users can upload own quick captures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quick-captures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view own quick captures" ON storage.objects;
CREATE POLICY "Users can view own quick captures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'quick-captures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own quick captures" ON storage.objects;
CREATE POLICY "Users can update own quick captures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quick-captures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own quick captures" ON storage.objects;
CREATE POLICY "Users can delete own quick captures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quick-captures'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
