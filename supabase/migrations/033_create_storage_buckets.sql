-- Create mapsite-assets storage bucket for Talispros Build System
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mapsite-assets',
  'mapsite-assets',
  true,
  20971520,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads on mapsite-assets
CREATE POLICY "Public can view mapsite-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mapsite-assets');

-- Allow authenticated uploads (server action uses service role)
CREATE POLICY "Authenticated can upload mapsite-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mapsite-assets');

-- Allow authenticated updates
CREATE POLICY "Authenticated can update mapsite-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mapsite-assets')
WITH CHECK (bucket_id = 'mapsite-assets');
