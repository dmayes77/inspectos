-- =====================================================
-- Inspection media storage bucket for item-level evidence
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own inspection media" ON storage.objects;
CREATE POLICY "Users can upload own inspection media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view own inspection media" ON storage.objects;
CREATE POLICY "Users can view own inspection media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own inspection media" ON storage.objects;
CREATE POLICY "Users can update own inspection media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own inspection media" ON storage.objects;
CREATE POLICY "Users can delete own inspection media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
