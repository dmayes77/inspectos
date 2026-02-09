-- =====================================================
-- STORAGE BUCKET FOR TENANT BRANDING
-- =====================================================

-- Create storage bucket for tenant branding assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152, -- 2MB limit for logos
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding bucket
CREATE POLICY "Authenticated users can upload branding assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Anyone can view branding assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

CREATE POLICY "Users can update own branding uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own branding uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding' AND auth.uid()::text = (storage.foldername(name))[1]);
