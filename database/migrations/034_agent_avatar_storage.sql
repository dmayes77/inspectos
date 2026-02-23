-- =====================================================
-- STORAGE BUCKET FOR AGENT AVATARS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-avatars',
  'agent-avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload agent avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-avatars');

CREATE POLICY "Anyone can view agent avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Authenticated users can update agent avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Authenticated users can delete agent avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agent-avatars');
